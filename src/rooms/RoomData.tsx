import { extractTagValue, extractTagValues, type ParsedEvent, type RequestObject, type WorkerMessage } from '@candypoets/nipworker';
import { useSubscription as subscribeToNostr } from '@candypoets/nipworker/hooks';
import { isEoce, isParsedEvent } from '@candypoets/nipworker/utils';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { CRAYS_PROTOCOL } from '@/nostr/protocol';
import {
  deriveEntitlements,
  type EntitlementAwardProjection,
  type EntitlementDefinitionProjection,
  type EntitlementStatusProjection,
} from '@/access/entitlements';
import {
  projectEntitlementDefinition,
  projectCalendarEvent,
  projectMembershipOffer,
  projectRoomPost,
  projectRoomProduct,
  projectRoomProfile,
} from '@/rooms/projections';
import type {
  RoomCalendarEvent,
  RoomMembershipOffer,
  RoomPerson,
  RoomPost,
  RoomProduct,
  RoomProfile,
  RoomOrder,
  RoomOrderStatus,
  RoomEntitlement,
} from '@/rooms/types';
import { useRoomSession } from '@/session/RoomSession';
import { getLocalPubkey } from '@/account/account';
import { saveMessageRelays } from '@/messages/relays';
import { useSafety } from '@/safety/Safety';

type PresenceProjection = {
  pubkey: string;
  intent: string;
  context: string;
  expiresAt: number;
  createdAt: number;
  visible: boolean;
};

export type RoomDataValue = {
  loading: boolean;
  connected: boolean;
  people: RoomPerson[];
  posts: RoomPost[];
  products: RoomProduct[];
  events: RoomCalendarEvent[];
  memberships: RoomMembershipOffer[];
  orders: RoomOrder[];
  entitlements: RoomEntitlement[];
  profiles: ReadonlyMap<string, RoomProfile>;
};

const EMPTY: RoomDataValue = {
  loading: false,
  connected: false,
  people: [],
  posts: [],
  products: [],
  events: [],
  memberships: [],
  orders: [],
  entitlements: [],
  profiles: new Map(),
};

const RoomDataContext = createContext<RoomDataValue>(EMPTY);

const ORDER_STATUSES = new Set<RoomOrderStatus>(['pending', 'accepted', 'processing', 'ready', 'fulfilled', 'cancelled']);
const ORDER_ARCHIVE_KEY = 'crays.orders.archive.v1';
const ENTITLEMENT_ARCHIVE_KEY = 'crays.entitlements.archive.v1';

function upsertById<T extends { id: string }>(items: T[], value: T): T[] {
  const index = items.findIndex((item) => item.id === value.id);
  if (index < 0) return [...items, value];
  const next = items.slice();
  next[index] = value;
  return next;
}

function presenceFromEvent(event: ParsedEvent, roomId: string): PresenceProjection | null {
  if (
    event.kind() !== CRAYS_PROTOCOL.roomActivityKind ||
    extractTagValue(event, 'schema') !== 'life.crays/presence/v1' ||
    extractTagValue(event, 'h') !== roomId ||
    extractTagValue(event, 'type') !== 'presence'
  ) return null;
  const pubkey = event.pubkey() ?? '';
  const expiresAt = Number(extractTagValue(event, 'expiration'));
  if (!pubkey || !Number.isSafeInteger(expiresAt)) return null;
  return {
    pubkey,
    intent: extractTagValue(event, 'intent') ?? 'Open to chat',
    context: extractTagValue(event, 'context') ?? '',
    expiresAt,
    createdAt: event.createdAt(),
    visible:
      extractTagValue(event, 'visibility') === 'visible' &&
      extractTagValue(event, 'status') !== 'left' &&
      expiresAt > Math.floor(Date.now() / 1000),
  };
}

export function RoomDataProvider({ children }: PropsWithChildren) {
  const { activeRoom } = useRoomSession();
  const { isBlocked } = useSafety();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [profiles, setProfiles] = useState<Map<string, RoomProfile>>(new Map());
  const [presences, setPresences] = useState<Map<string, PresenceProjection>>(new Map());
  const [posts, setPosts] = useState<RoomPost[]>([]);
  const [products, setProducts] = useState<RoomProduct[]>([]);
  const [events, setEvents] = useState<RoomCalendarEvent[]>([]);
  const [memberships, setMemberships] = useState<RoomMembershipOffer[]>([]);
  const [viewerPubkey, setViewerPubkey] = useState<string | null>(null);
  const [awards, setAwards] = useState<EntitlementAwardProjection[]>([]);
  const [statuses, setStatuses] = useState<EntitlementStatusProjection[]>([]);
  const [definitions, setDefinitions] = useState<Map<string, EntitlementDefinitionProjection>>(new Map());
  const [revocations, setRevocations] = useState<Map<string, string>>(new Map());
  const [archivedOrders, setArchivedOrders] = useState<RoomOrder[]>([]);
  const [archivedEntitlements, setArchivedEntitlements] = useState<RoomEntitlement[]>([]);
  // Refs mirror the archive state so persistence effects can compute the next
  // snapshot without a read inside a state updater (updaters must stay pure).
  const archivedOrdersRef = useRef<RoomOrder[]>([]);
  const archivedEntitlementsRef = useRef<RoomEntitlement[]>([]);
  const [projectionNow, setProjectionNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    void Promise.all([
      SecureStore.getItemAsync(ORDER_ARCHIVE_KEY),
      SecureStore.getItemAsync(ENTITLEMENT_ARCHIVE_KEY),
    ]).then(([orderValue, entitlementValue]) => {
      try {
        const parsed = JSON.parse(orderValue || '[]') as RoomOrder[];
        const next = parsed.filter((item) => item?.id && item?.product?.address).slice(0, 200);
        archivedOrdersRef.current = next;
        setArchivedOrders(next);
      } catch { /* Invalid cache is ignored; relay truth can rebuild it. */ }
      try {
        const parsed = JSON.parse(entitlementValue || '[]') as RoomEntitlement[];
        const next = parsed.filter((item) => item?.awardId && item?.badgeAddress && item?.relayUrl).slice(0, 200);
        archivedEntitlementsRef.current = next;
        setArchivedEntitlements(next);
      } catch { /* Invalid cache is ignored; relay truth can rebuild it. */ }
    });
  }, []);

  useEffect(() => { getLocalPubkey().then(setViewerPubkey).catch(() => setViewerPubkey(null)); }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;
    const timer = setInterval(() => setProjectionNow(Math.floor(Date.now() / 1000)), 15_000);
    return () => clearInterval(timer);
  }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom || !viewerPubkey) return;
    void saveMessageRelays(viewerPubkey, [activeRoom.connectionRelayUrl || activeRoom.relayUrl]);
  }, [activeRoom, viewerPubkey]);

  useEffect(() => {
    // Reset projections when the selected relay changes; callbacks then refill them.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfiles(new Map());
    setPresences(new Map());
    setPosts([]);
    setProducts([]);
    setEvents([]);
    setMemberships([]);
    setAwards([]);
    setStatuses([]);
    setDefinitions(new Map());
    setRevocations(new Map());
    setConnected(false);
    if (!activeRoom) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const relayUrl = activeRoom.connectionRelayUrl || activeRoom.relayUrl;

    const handleMessage = (message: WorkerMessage) => {
        // A healthy relay can legitimately have no matching events. EOSE is
        // therefore the authoritative ready signal for an empty result set.
        if (isEoce(message)) {
          setConnected(true);
          setLoading(false);
          return;
        }
        const event = isParsedEvent(message);
        if (!event) return;
        setConnected(true);
        setLoading(false);

        if (event.kind() === CRAYS_PROTOCOL.badgeAwardKind && viewerPubkey) {
          const id = event.id() ?? '';
          const address = extractTagValue(event, 'a') ?? '';
          const recipientPubkey = extractTagValue(event, 'p') ?? '';
          const issuer = event.pubkey() ?? '';
          if (id && address && recipientPubkey === viewerPubkey && activeRoom.awardIssuerPubkey && issuer === activeRoom.awardIssuerPubkey) {
            const invoice = extractTagValue(event, 'i') ?? '';
            const orderRef = extractTagValue(event, 'order') || invoice.replace(/^payment-redemption:/, '') || id;
            const expiration = Number(extractTagValue(event, 'expiration'));
            setAwards((current) => upsertById(current, {
              id, address, issuerPubkey: issuer, recipientPubkey, orderRef, createdAt: event.createdAt(),
              ...(Number.isSafeInteger(expiration) && expiration > 0 ? { expiresAt: expiration } : {}),
            }));
            if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'award', id })}`);
          }
          return;
        }

        if (event.kind() === CRAYS_PROTOCOL.eventDeletionKind && activeRoom.awardIssuerPubkey && event.pubkey() === activeRoom.awardIssuerPubkey) {
          const issuer = event.pubkey() ?? '';
          for (const awardId of extractTagValues(event, 'e')) {
            setRevocations((current) => new Map(current).set(awardId, issuer));
          }
          return;
        }

        if ((event.kind() === CRAYS_PROTOCOL.orderStatusKind || event.kind() === CRAYS_PROTOCOL.legacyOrderStatusKind) && viewerPubkey) {
          const id = event.id() ?? '';
          const awardId = extractTagValue(event, 'e') ?? '';
          const address = extractTagValue(event, 'a') ?? '';
          const recipientPubkey = extractTagValue(event, 'p') ?? '';
          const orderRef = extractTagValue(event, 'order') ?? '';
          const eventContext = extractTagValue(event, 'event') ?? '';
          const contextKey = extractTagValue(event, 'd') || (orderRef ? `order:${orderRef}` : eventContext ? `event:${eventContext}` : '');
          const status = extractTagValue(event, 'status') as RoomOrderStatus | undefined;
          if (id && awardId && address && recipientPubkey === viewerPubkey && event.pubkey() === activeRoom.operatorPubkey && contextKey && status && ORDER_STATUSES.has(status)) {
            setStatuses((current) => upsertById(current, { id, awardId, address, recipientPubkey, contextKey, status, createdAt: event.createdAt() }));
            if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'order-status', id, status })}`);
          }
          return;
        }

        const profile = projectRoomProfile(event);
        if (profile) {
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'profile', pubkey: profile.pubkey })}`);
          setProfiles((current) => {
            const previous = current.get(profile.pubkey);
            if (previous && previous.createdAt >= profile.createdAt) return current;
            const next = new Map(current);
            next.set(profile.pubkey, profile);
            return next;
          });
          return;
        }

        const presence = presenceFromEvent(event, activeRoom.id);
        if (presence) {
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'presence', pubkey: presence.pubkey, visible: presence.visible })}`);
          setPresences((current) => {
            const previous = current.get(presence.pubkey);
            if (previous && previous.createdAt >= presence.createdAt) return current;
            const next = new Map(current);
            next.set(presence.pubkey, presence);
            return next;
          });
          return;
        }

        const post = projectRoomPost(event, activeRoom.id);
        if (post) {
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'post', id: post.id })}`);
          setPosts((current) => upsertById(current, post).sort((a, b) => b.createdAt - a.createdAt));
          return;
        }

        const product = projectRoomProduct(event, activeRoom.operatorPubkey);
        if (product) {
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'product', id: product.id })}`);
          setProducts((current) => upsertById(current, product).sort((a, b) => a.position - b.position));
          return;
        }

        const entitlementDefinition = projectEntitlementDefinition(event, activeRoom.operatorPubkey);
        if (entitlementDefinition) {
          setDefinitions((current) => {
            const previous = current.get(entitlementDefinition.address);
            if (previous?.id === entitlementDefinition.id) return current;
            return new Map(current).set(entitlementDefinition.address, entitlementDefinition);
          });
          // Membership definitions are also projected into the offer list by
          // projectMembershipOffer below, so they must fall through; every
          // other entitlement type is fully handled here.
          if (entitlementDefinition.type !== 'membership') return;
        }

        const membership = projectMembershipOffer(event, activeRoom.operatorPubkey);
        if (membership) {
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'membership', id: membership.id })}`);
          setMemberships((current) => upsertById(current, membership));
          return;
        }

        const calendarEvent = projectCalendarEvent(event, activeRoom.operatorPubkey);
        if (calendarEvent) {
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'event', id: calendarEvent.id })}`);
          setEvents((current) => upsertById(current, calendarEvent).sort((a, b) => a.start - b.start));
        }
    };
    // NIP-01 replaces a live REQ when its subscription id is reused. Each
    // concurrent result family therefore owns a distinct deterministic id.
    const subscriptions: [string, RequestObject][] = [
      ['presence', { kinds: [CRAYS_PROTOCOL.roomActivityKind], tags: { '#h': [activeRoom.id] }, relays: [relayUrl], limit: 200, noCache: true }],
      ['profiles', { kinds: [CRAYS_PROTOCOL.profileKind], relays: [relayUrl], limit: 200, noCache: true }],
      ['feed', { kinds: [CRAYS_PROTOCOL.roomFeedKind], tags: { '#h': [activeRoom.id] }, relays: [relayUrl], limit: 100, noCache: true }],
      ['catalog', { kinds: [CRAYS_PROTOCOL.badgeDefinitionKind], authors: [activeRoom.operatorPubkey], relays: [relayUrl], limit: 200, noCache: true }],
      ['events', { kinds: [...CRAYS_PROTOCOL.calendarKinds], authors: [activeRoom.operatorPubkey], relays: [relayUrl], limit: 100, noCache: true }],
      ...(activeRoom.awardIssuerPubkey ? [['revocations', { kinds: [CRAYS_PROTOCOL.eventDeletionKind], authors: [activeRoom.awardIssuerPubkey], relays: [relayUrl], limit: 200, noCache: true }] as [string, RequestObject]] : []),
    ];
    if (viewerPubkey) subscriptions.push(
      ['awards', { kinds: [CRAYS_PROTOCOL.badgeAwardKind], tags: { '#p': [viewerPubkey] }, relays: [relayUrl], limit: 200, noCache: true }],
      ['statuses', { kinds: [CRAYS_PROTOCOL.orderStatusKind, CRAYS_PROTOCOL.legacyOrderStatusKind], tags: { '#p': [viewerPubkey] }, relays: [relayUrl], limit: 200, noCache: true }],
    );
    const unsubscribes = subscriptions.map(([family, filter]) => subscribeToNostr(
      `room_${family}_${activeRoom.id}`,
      [filter],
      handleMessage,
      { closeOnEose: false, bytesPerEvent: 12 * 1024 },
    ));

    const timeout = setTimeout(() => setLoading(false), 10_000);
    return () => {
      clearTimeout(timeout);
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [activeRoom, viewerPubkey]);

  const people = useMemo(() => {
    return Array.from(presences.values())
      .filter((presence) => presence.visible && presence.expiresAt > projectionNow && !isBlocked(presence.pubkey, activeRoom?.id))
      .map((presence) => {
        const profile = profiles.get(presence.pubkey);
        if (!profile) return null;
        return {
          ...profile,
          intent: presence.intent,
          context: presence.context || profile.about,
          expiresAt: presence.expiresAt,
        } satisfies RoomPerson;
      })
      .filter((person): person is RoomPerson => person !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeRoom?.id, isBlocked, presences, profiles, projectionNow]);

  const visiblePosts = useMemo(() => posts.filter((post) => !isBlocked(post.pubkey, activeRoom?.id)), [activeRoom?.id, isBlocked, posts]);

  const liveOrders = useMemo<RoomOrder[]>(() => awards.flatMap((award) => {
    const product = products.find((candidate) => candidate.address === award.address);
    if (!product) return [];
    const latest = statuses
      .filter((status) => status.awardId === award.id && status.address === award.address && status.contextKey.startsWith('order:'))
      .sort((left, right) => right.createdAt - left.createdAt || left.id.localeCompare(right.id))[0];
    const statusOrderRef = latest?.contextKey.slice('order:'.length);
    return [{ id: `${award.id}:${statusOrderRef || award.orderRef}`, awardId: award.id, orderRef: statusOrderRef || award.orderRef, product, status: latest?.status || 'pending', createdAt: award.createdAt, updatedAt: latest?.createdAt || award.createdAt, recipientPubkey: award.recipientPubkey, roomId: activeRoom?.id, roomName: activeRoom?.name }];
  }).sort((a, b) => b.updatedAt - a.updatedAt), [activeRoom?.id, activeRoom?.name, awards, products, statuses]);

  useEffect(() => {
    if (!liveOrders.length) return;
    // Persist a signed-event projection for durable navigation; relay reconnect revalidates it.
    // The merge and the SecureStore write happen outside the state updater:
    // updaters must be pure because StrictMode double-invokes them.
    const next = [...liveOrders, ...archivedOrdersRef.current.filter((item) => !liveOrders.some((live) => live.id === item.id))].slice(0, 200);
    archivedOrdersRef.current = next;
    void SecureStore.setItemAsync(ORDER_ARCHIVE_KEY, JSON.stringify(next));
    setArchivedOrders(next);
  }, [liveOrders]);

  const orders = useMemo(() => [...liveOrders, ...archivedOrders.filter((item) => !liveOrders.some((live) => live.id === item.id))].sort((a, b) => b.updatedAt - a.updatedAt), [archivedOrders, liveOrders]);

  const liveEntitlements = useMemo(() => activeRoom ? deriveEntitlements({
    awards,
    definitions,
    statuses,
    revokedAwardIds: new Set(Array.from(revocations.entries()).filter(([awardId, issuer]) => awards.some((award) => award.id === awardId && award.issuerPubkey === issuer)).map(([awardId]) => awardId)),
    // Presentation is portable to staff scanners, so it carries the signed
    // manifest relay URL—not this device's QA/proxy transport override.
    room: { id: activeRoom.id, name: activeRoom.name, relayUrl: activeRoom.relayUrl },
    now: projectionNow,
  }) : [], [activeRoom, awards, definitions, projectionNow, revocations, statuses]);

  useEffect(() => {
    if (!liveEntitlements.length) return;
    // Persist a signed-event projection for durable navigation; relay reconnect revalidates it.
    // The merge and the SecureStore write happen outside the state updater:
    // updaters must be pure because StrictMode double-invokes them.
    const next = [...liveEntitlements, ...archivedEntitlementsRef.current.filter((item) => !liveEntitlements.some((live) => live.awardId === item.awardId))].slice(0, 200);
    archivedEntitlementsRef.current = next;
    void SecureStore.setItemAsync(ENTITLEMENT_ARCHIVE_KEY, JSON.stringify(next));
    setArchivedEntitlements(next);
  }, [liveEntitlements]);

  const entitlements = useMemo(
    () => [...liveEntitlements, ...archivedEntitlements.filter((item) => !liveEntitlements.some((live) => live.awardId === item.awardId))],
    [archivedEntitlements, liveEntitlements],
  );

  const value = useMemo<RoomDataValue>(() => ({
    loading,
    connected,
    people,
    posts: visiblePosts,
    products,
    events,
    memberships,
    orders,
    entitlements,
    profiles,
  }), [connected, entitlements, events, loading, memberships, orders, people, products, profiles, visiblePosts]);

  return <RoomDataContext.Provider value={value}>{children}</RoomDataContext.Provider>;
}

export function useRoomData(): RoomDataValue {
  return useContext(RoomDataContext);
}

import { extractTagValue, extractTagValues, type RequestObject, type WorkerMessage } from '@candypoets/nipworker';
import { useSubscription as subscribeToNostr } from '@candypoets/nipworker/hooks';
import { isEoce, isParsedEvent } from '@candypoets/nipworker/utils';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

import { ensureLocalIdentity, getLocalPubkey } from '@/account/account';
import {
  CRAYS_PROTOCOL,
  PRESENCE_HEARTBEAT_INTERVAL_MS,
  presenceTemplate,
} from '@/nostr/protocol';
import { publishEvent } from '@/nostr/publish';
import { isNewerAnchor, parseCommunityAnchor, type CommunityAnchor } from '@/access/nip97';
import {
  awardIssuerValid,
  fetchRelayRootPubkeyWithRetry,
  statusSignerValid,
  trustFromAnchor,
  type CommunityTrust,
} from '@/rooms/trust';
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
import { saveMessageRelays } from '@/messages/relays';
import { subscribeNip04Messages } from '@/messages/subscription';
import { useSafety } from '@/safety/Safety';
import { canOpenRoomSubscriptions, type RoomRelayAuth } from '@/rooms/relayAuthGate';
import {
  isNewerRoomPresence,
  projectRoomPresence,
  type RoomPresenceProjection,
} from '@/rooms/presence';

export type RoomDataValue = {
  archiveError: string | null;
  archiveHydrated: boolean;
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
  archiveError: null,
  archiveHydrated: false,
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
// Archive keys are versioned: the NIP-97 migration dropped the pre-NIP
// (30009 type-tag) projections, so v1 caches are abandoned rather than read.
const ORDER_ARCHIVE_KEY = 'crays.orders.archive.v2';
const ENTITLEMENT_ARCHIVE_KEY = 'crays.entitlements.archive.v2';

function upsertById<T extends { id: string }>(items: T[], value: T): T[] {
  const index = items.findIndex((item) => item.id === value.id);
  if (index < 0) return [...items, value];
  const next = items.slice();
  next[index] = value;
  return next;
}

export function RoomDataProvider({ children }: PropsWithChildren) {
  const { activeRoom } = useRoomSession();
  const activeSessionKey = activeRoom
    ? `${activeRoom.address}|${activeRoom.joinedAt}|${activeRoom.connectionRelayUrl || activeRoom.relayUrl}`
    : '';
  const { isBlocked } = useSafety();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [profiles, setProfiles] = useState<Map<string, RoomProfile>>(new Map());
  const [presences, setPresences] = useState<Map<string, RoomPresenceProjection>>(new Map());
  const [posts, setPosts] = useState<RoomPost[]>([]);
  const [products, setProducts] = useState<RoomProduct[]>([]);
  const [events, setEvents] = useState<RoomCalendarEvent[]>([]);
  const [memberships, setMemberships] = useState<RoomMembershipOffer[]>([]);
  const [viewerPubkey, setViewerPubkey] = useState<string | null>(null);
  const [awards, setAwards] = useState<EntitlementAwardProjection[]>([]);
  const [statuses, setStatuses] = useState<EntitlementStatusProjection[]>([]);
  const [definitions, setDefinitions] = useState<Map<string, EntitlementDefinitionProjection>>(new Map());
  const [revocations, setRevocations] = useState<Map<string, string>>(new Map());
  const [communityTrust, setCommunityTrust] = useState<CommunityTrust | null>(null);
  const [archivedOrders, setArchivedOrders] = useState<RoomOrder[]>([]);
  const [archivedEntitlements, setArchivedEntitlements] = useState<RoomEntitlement[]>([]);
  const [archiveHydrated, setArchiveHydrated] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [relayAuth, setRelayAuth] = useState<RoomRelayAuth | null>(null);
  // Refs mirror the archive state so persistence effects can compute the next
  // snapshot without a read inside a state updater (updaters must stay pure).
  const archivedOrdersRef = useRef<RoomOrder[]>([]);
  const archivedEntitlementsRef = useRef<RoomEntitlement[]>([]);
  const [projectionNow, setProjectionNow] = useState(() => Math.floor(Date.now() / 1000));
  const [resolvedCommunity, setResolvedCommunity] = useState<{
    sessionKey: string;
    rootPubkey: string;
  } | null>(null);

  useEffect(() => {
    let current = true;
    void Promise.all([
      SecureStore.getItemAsync(ORDER_ARCHIVE_KEY),
      SecureStore.getItemAsync(ENTITLEMENT_ARCHIVE_KEY),
    ]).then(([orderValue, entitlementValue]) => {
      if (!current) return;
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
    }).catch(() => {
      if (current) setArchiveError('Saved orders and access could not be read on this device.');
    }).finally(() => {
      if (current) setArchiveHydrated(true);
    });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => { getLocalPubkey().then(setViewerPubkey).catch(() => setViewerPubkey(null)); }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom || !viewerPubkey) {
      // This state reflects an external connection lease, not a render-time derivation.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRelayAuth(null);
      return;
    }
    const relayUrl = activeRoom.connectionRelayUrl || activeRoom.relayUrl;
    const key = `${viewerPubkey}:${relayUrl}`;
    let stopped = false;
    let unsubscribe: () => void = () => undefined;
    // Joining updates the session immediately before replacing the preview
    // route. Let its room-definition lookup lease release first so this private
    // request is the first frame on the fresh venue connection.
    const startTimer = setTimeout(() => {
      if (stopped) return;
      unsubscribe = subscribeNip04Messages({
        onEvent: () => undefined,
        onReady: () => {
          if (!stopped) {
            clearTimeout(timeout);
            setRelayAuth({ key, status: 'ready' });
          }
        },
        pubkey: viewerPubkey,
        relays: [relayUrl],
      });
    }, 350);
    const timeout = setTimeout(() => {
      if (!stopped) setRelayAuth({ key, status: 'failed' });
    }, 10_000);
    setRelayAuth({ key, status: 'pending' });
    return () => {
      stopped = true;
      clearTimeout(startTimer);
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [activeRoom, viewerPubkey]);

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
    setCommunityTrust(null);
    setResolvedCommunity(null);
    setConnected(false);
    if (!activeRoom) {
      setLoading(false);
      return;
    }
    const relayUrl = activeRoom.connectionRelayUrl || activeRoom.relayUrl;
    const relayAuthKey = viewerPubkey ? `${viewerPubkey}:${relayUrl}` : '';
    if (!canOpenRoomSubscriptions(viewerPubkey, relayUrl, relayAuth)) {
      setLoading(relayAuth?.key !== relayAuthKey || relayAuth?.status !== 'failed');
      return;
    }
    setLoading(true);
    let cancelled = false;
    // The resolved NIP-97 trust for this room, held in a closure so the ingest
    // path reads the current anchor without re-running the effect.
    const trustHolder: { current: CommunityTrust | null } = { current: null };
    const NO_ADMINS: ReadonlySet<string> = new Set();
    const currentAdmins = () => trustHolder.current?.admins ?? NO_ADMINS;

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
          // Issuer trust is applied at derivation time against the anchor, so
          // awards arriving before the anchor resolves are simply buffered.
          if (id && address && recipientPubkey === viewerPubkey) {
            const invoice = extractTagValue(event, 'i') ?? '';
            const orderRef = extractTagValue(event, 'order') || invoice.replace(/^payment-redemption:/, '') || id;
            const expiration = Number(extractTagValue(event, 'expiration'));
            setAwards((current) => upsertById(current, {
              id, address, issuerPubkey: event.pubkey() ?? '', recipientPubkey, orderRef, createdAt: event.createdAt(),
              ...(Number.isSafeInteger(expiration) && expiration > 0 ? { expiresAt: expiration } : {}),
            }));
            if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'award', id })}`);
          }
          return;
        }

        if (event.kind() === CRAYS_PROTOCOL.eventDeletionKind) {
          const deleter = event.pubkey() ?? '';
          if (!deleter) return;
          for (const awardId of extractTagValues(event, 'e')) {
            setRevocations((current) => new Map(current).set(awardId, deleter));
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
          // Signer trust (anchor admin / badge issuer) is applied at derivation.
          if (id && awardId && address && recipientPubkey === viewerPubkey && contextKey && status && ORDER_STATUSES.has(status)) {
            setStatuses((current) => upsertById(current, { id, awardId, address, recipientPubkey, signerPubkey: event.pubkey() ?? '', contextKey, status, createdAt: event.createdAt() }));
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

        const presence = projectRoomPresence(event, activeRoom.address);
        if (presence) {
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'presence', pubkey: presence.pubkey, visible: presence.visible })}`);
          setPresences((current) => {
            const previous = current.get(presence.pubkey);
            if (previous && !isNewerRoomPresence(presence, previous)) return current;
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

        const entitlementDefinition = projectEntitlementDefinition(event, currentAdmins());
        if (entitlementDefinition) {
          setDefinitions((current) => {
            const previous = current.get(entitlementDefinition.address);
            if (previous?.id === entitlementDefinition.id) return current;
            return new Map(current).set(entitlementDefinition.address, entitlementDefinition);
          });
          // The same event may also surface as a menu item, membership offer,
          // or calendar event below; definition and display projections share
          // one addressable event under NIP-97.
        }

        const product = projectRoomProduct(event, currentAdmins());
        if (product) {
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'product', id: product.id })}`);
          setProducts((current) => upsertById(current, product).sort((a, b) => a.position - b.position));
          return;
        }

        const membership = projectMembershipOffer(event, currentAdmins());
        if (membership) {
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'membership', id: membership.id })}`);
          setMemberships((current) => upsertById(current, membership));
          return;
        }

        const calendarEvent = projectCalendarEvent(event, currentAdmins());
        if (calendarEvent) {
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'event', id: calendarEvent.id })}`);
          setEvents((current) => upsertById(current, calendarEvent).sort((a, b) => a.start - b.start));
        }
    };
    // NIP-01 replaces a live REQ when its subscription id is reused. Each
    // concurrent result family therefore owns a distinct deterministic id.
    const unsubscribes: (() => void)[] = [];
    let phaseTwoUnsubscribes: (() => void)[] = [];
    let phaseTwoKey = '';
    // Phase 2: venue-authored families scoped to the anchor admins (+ issuer).
    const openPhaseTwo = (trust: CommunityTrust) => {
      const authors = [...trust.admins];
      const key = `${authors.slice().sort().join(',')}|${trust.badgeIssuer ?? ''}`;
      if (cancelled || key === phaseTwoKey) return;
      phaseTwoKey = key;
      phaseTwoUnsubscribes.forEach((unsubscribe) => unsubscribe());
      const subscriptions: [string, RequestObject][] = [
        ['catalog', { kinds: [CRAYS_PROTOCOL.badgeDefinitionKind, CRAYS_PROTOCOL.listingKind], authors, relays: [relayUrl], limit: 200, noCache: true }],
        ['events', { kinds: [...CRAYS_PROTOCOL.calendarKinds], authors, relays: [relayUrl], limit: 100, noCache: true }],
        ['revocations', { kinds: [CRAYS_PROTOCOL.eventDeletionKind], authors: [...authors, ...(trust.badgeIssuer ? [trust.badgeIssuer] : [])], relays: [relayUrl], limit: 200, noCache: true }],
      ];
      phaseTwoUnsubscribes = subscriptions.map(([family, filter]) => subscribeToNostr(
        `room_${family}_${activeRoom.id}`,
        [filter],
        handleMessage,
        { closeOnEose: false, bytesPerEvent: 12 * 1024 },
      ));
    };
    // Phase 1: member-authored and viewer-scoped families open immediately.
    const subscriptions: [string, RequestObject][] = [
      ['profiles', { kinds: [CRAYS_PROTOCOL.profileKind], relays: [relayUrl], limit: 200, noCache: true }],
      ['presence', { kinds: [CRAYS_PROTOCOL.roomPresenceKind], tags: { '#a': [activeRoom.address] }, relays: [relayUrl], limit: 200, noCache: true }],
      ['feed', { kinds: [CRAYS_PROTOCOL.roomFeedKind], tags: { '#h': [activeRoom.id] }, relays: [relayUrl], limit: 100, noCache: true }],
    ];
    if (viewerPubkey) subscriptions.push(
      ['awards', { kinds: [CRAYS_PROTOCOL.badgeAwardKind], tags: { '#p': [viewerPubkey] }, relays: [relayUrl], limit: 200, noCache: true }],
      ['statuses', { kinds: [CRAYS_PROTOCOL.orderStatusKind, CRAYS_PROTOCOL.legacyOrderStatusKind], tags: { '#p': [viewerPubkey] }, relays: [relayUrl], limit: 200, noCache: true }],
    );
    unsubscribes.push(...subscriptions.map(([family, filter]) => subscribeToNostr(
      `room_${family}_${activeRoom.id}`,
      [filter],
      handleMessage,
      { closeOnEose: false, bytesPerEvent: 12 * 1024 },
    )));

    // NIP-97 trust chain: the relay's NIP-11 pubkey is the community root key;
    // the root-signed anchor declares admins and the delegated badge issuer.
    fetchRelayRootPubkeyWithRetry(relayUrl).then((rootPubkey) => {
      if (cancelled) return;
      if (rootPubkey !== activeRoom.rootPubkey) {
        setLoading(false);
        if (__DEV__) console.warn('[crays-room-data] relay root changed after room entry');
        return;
      }
      let currentAnchor: CommunityAnchor | null = null;
      unsubscribes.push(subscribeToNostr(
        `room_anchor_${activeRoom.id}`,
        [{ kinds: [CRAYS_PROTOCOL.anchorKind], authors: [rootPubkey], tags: { '#d': ['community'] }, relays: [relayUrl], limit: 10, noCache: true }],
        (message) => {
          const event = isParsedEvent(message);
          if (!event) return;
          const anchor = parseCommunityAnchor(event);
          if (!anchor || anchor.pubkey !== rootPubkey) return;
          if (currentAnchor && !isNewerAnchor(anchor, currentAnchor)) return;
          currentAnchor = anchor;
          const trust = trustFromAnchor(anchor);
          if (activeRoom.operatorPubkey !== rootPubkey && !trust.admins.has(activeRoom.operatorPubkey)) {
            trustHolder.current = null;
            setCommunityTrust(null);
            setResolvedCommunity(null);
            if (__DEV__) console.warn('[crays-room-data] room definition author is no longer authorized by the community anchor');
            return;
          }
          trustHolder.current = trust;
          setCommunityTrust(trust);
          setResolvedCommunity({ sessionKey: activeSessionKey, rootPubkey });
          if (__DEV__) console.info(`[crays-room-data]${JSON.stringify({ type: 'anchor', admins: anchor.admins.length })}`);
          openPhaseTwo(trust);
        },
        { closeOnEose: false, bytesPerEvent: 12 * 1024 },
      ));
    }).catch((error) => {
      // Feed/profile reads can remain usable, but room-bound roster and
      // entitlement projections stay empty until the root resolves.
      if (__DEV__) console.warn(`[crays-room-data] NIP-11 root resolution failed for ${relayUrl}: ${error?.message ?? error}`);
    });

    const timeout = setTimeout(() => setLoading(false), 10_000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      phaseTwoUnsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [activeRoom, activeSessionKey, relayAuth, viewerPubkey]);

  useEffect(() => {
    if (
      !activeRoom ||
      activeRoom.visibility !== 'visible' ||
      !resolvedCommunity ||
      resolvedCommunity.sessionKey !== activeSessionKey
    ) return;

    let cancelled = false;
    let publishing = false;
    const transportRelayUrl = activeRoom.connectionRelayUrl || activeRoom.relayUrl;
    const refreshPresence = async () => {
      if (cancelled || publishing || Date.now() >= activeRoom.leaveAt) return;
      publishing = true;
      try {
        await ensureLocalIdentity();
        if (cancelled) return;
        await publishEvent(
          presenceTemplate({
            roomAddress: activeRoom.address,
            relayUrl: activeRoom.relayUrl,
            intent: activeRoom.intent,
            context: activeRoom.context,
            expiresAt: Math.floor(activeRoom.leaveAt / 1000),
          }),
          [transportRelayUrl],
          'room_presence_heartbeat',
        );
      } catch (error) {
        // Joining already required a confirmed initial write. A transient
        // heartbeat failure must not eject the user; freshness/expiry safely
        // removes presence if the relay remains unavailable.
        if (__DEV__) console.warn(`[crays-room-presence] heartbeat failed: ${error instanceof Error ? error.message : error}`);
      } finally {
        publishing = false;
      }
    };

    void refreshPresence();
    const timer = setInterval(() => void refreshPresence(), PRESENCE_HEARTBEAT_INTERVAL_MS);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPresence();
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
      appStateSubscription.remove();
    };
  }, [activeRoom, activeSessionKey, resolvedCommunity]);

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

  const liveOrders = useMemo<RoomOrder[]>(() => {
    if (!communityTrust) return [];
    return awards.flatMap((award) => {
      const product = products.find((candidate) => candidate.address === award.address);
      const definition = definitions.get(award.address);
      if (!product || !definition) return [];
      if (!awardIssuerValid({ issuer: award.issuerPubkey, sellable: definition.sellable, trust: communityTrust })) return [];
      const latest = statuses
        .filter((status) => status.awardId === award.id && status.address === award.address && status.contextKey.startsWith('order:') && statusSignerValid(status.signerPubkey, communityTrust))
        .sort((left, right) => right.createdAt - left.createdAt || left.id.localeCompare(right.id))[0];
      const statusOrderRef = latest?.contextKey.slice('order:'.length);
      return [{ id: `${award.id}:${statusOrderRef || award.orderRef}`, awardId: award.id, orderRef: statusOrderRef || award.orderRef, product, status: latest?.status || 'pending', createdAt: award.createdAt, updatedAt: latest?.createdAt || award.createdAt, recipientPubkey: award.recipientPubkey, roomId: activeRoom?.id, roomName: activeRoom?.name }];
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [activeRoom?.id, activeRoom?.name, awards, communityTrust, definitions, products, statuses]);

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

  const liveEntitlements = useMemo(() => activeRoom && communityTrust ? deriveEntitlements({
    awards,
    definitions,
    statuses,
    revocations,
    trust: communityTrust,
    // Presentation is portable to staff scanners, so it carries the signed
    // definition relay URL—not this device's QA/proxy transport override.
    room: { id: activeRoom.id, name: activeRoom.name, relayUrl: activeRoom.relayUrl },
    now: projectionNow,
  }) : [], [activeRoom, awards, communityTrust, definitions, projectionNow, revocations, statuses]);

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
    archiveError,
    archiveHydrated,
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
  }), [archiveError, archiveHydrated, connected, entitlements, events, loading, memberships, orders, people, products, profiles, visiblePosts]);

  return <RoomDataContext.Provider value={value}>{children}</RoomDataContext.Provider>;
}

export function useRoomData(): RoomDataValue {
  return useContext(RoomDataContext);
}

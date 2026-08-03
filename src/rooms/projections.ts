import { extractTagValue, extractTagValues, type ParsedEvent, type PreGenericParsed } from '@candypoets/nipworker';
import { asKind0, asKind1, fbIterable } from '@candypoets/nipworker/utils';

import { CRAYS_PROTOCOL } from '@/nostr/protocol';
import type {
  RoomCalendarEvent,
  RoomCapability,
  RoomDescriptor,
  RoomMembershipOffer,
  RoomPost,
  RoomProduct,
  RoomProfile,
  RoomEntitlementType,
} from '@/rooms/types';
import type { EntitlementDefinitionProjection } from '@/access/entitlements';

const CAPABILITIES = new Set<RoomCapability>(['social', 'menu', 'events', 'membership']);

/**
 * The room selector must survive the FlatBuffer subscription scope, so this
 * is the intentional minimal-copy boundary. All validation reads directly
 * from the parsed event before constructing the stable app input.
 */
export function projectRoomManifest(event: ParsedEvent, generic: PreGenericParsed): RoomDescriptor | null {
  if (event.kind() !== CRAYS_PROTOCOL.roomManifestKind) return null;
  const d = extractTagValue(event, 'd');
  const schema = extractTagValue(event, 'schema');
  const name = extractTagValue(event, 'name');
  const relayUrl = extractTagValue(event, 'relay');
  const operator = extractTagValue(event, 'operator');
  const expiration = Number(extractTagValue(event, 'expiration'));
  const pubkey = event.pubkey() ?? '';
  const awardIssuerPubkey = extractTagValue(event, 'award_issuer');
  if (
    !d?.startsWith('life.crays/room/v1/') ||
    schema !== 'life.crays/room/v1' ||
    !name ||
    !relayUrl ||
    !operator ||
    operator !== pubkey ||
    !Number.isSafeInteger(expiration) ||
    expiration <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  const capabilities = extractTagValues(event, 'capability').filter(
    (value: string): value is RoomCapability => CAPABILITIES.has(value as RoomCapability),
  );
  return {
    id: d.slice('life.crays/room/v1/'.length),
    name,
    about: extractTagValue(event, 'about') ?? generic.description() ?? '',
    relayUrl,
    operatorPubkey: operator,
    capabilities,
    expiresAt: expiration,
    open: extractTagValue(event, 'open') !== 'closed',
    verified: true,
    ...(awardIssuerPubkey && /^[0-9a-f]{64}$/i.test(awardIssuerPubkey) ? { awardIssuerPubkey } : {}),
  };
}

function finiteNumber(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function projectRoomProfile(event: ParsedEvent): RoomProfile | null {
  if (event.kind() !== CRAYS_PROTOCOL.profileKind) return null;
  const pubkey = event.pubkey() ?? '';
  if (!pubkey) return null;
  const profile = asKind0(event);
  if (!profile) return null;
  const name = (profile.displayName() ?? profile.name() ?? '').trim();
  if (!name) return null;
  return {
    pubkey,
    name,
    about: profile.about()?.trim() ?? '',
    picture: profile.picture() ?? undefined,
    createdAt: event.createdAt(),
  };
}

export function projectRoomPost(event: ParsedEvent, roomId: string): RoomPost | null {
  if (event.kind() !== CRAYS_PROTOCOL.roomFeedKind || extractTagValue(event, 'h') !== roomId) return null;
  const expiration = finiteNumber(extractTagValue(event, 'expiration'));
  const now = Math.floor(Date.now() / 1000);
  const id = event.id() ?? '';
  const pubkey = event.pubkey() ?? '';
  const parsed = asKind1(event);
  if (!parsed) return null;
  const content = Array.from(fbIterable(parsed, 'parsedContent'), (block) => block.text() ?? '').join('').trim();
  if (!id || !pubkey || !content || (expiration > 0 && expiration <= now)) return null;
  return {
    id,
    pubkey,
    content,
    createdAt: event.createdAt(),
    announcement: extractTagValue(event, 'type') === 'announcement',
    expiresAt: expiration,
  };
}

export function projectRoomProduct(event: ParsedEvent, operatorPubkey: string): RoomProduct | null {
  if (event.kind() !== CRAYS_PROTOCOL.badgeDefinitionKind || event.pubkey() !== operatorPubkey) return null;
  const type = extractTagValue(event, 'type');
  if (type !== 'product') return null;
  const d = extractTagValue(event, 'd');
  const name = extractTagValue(event, 'name');
  const price = finiteNumber(extractTagValue(event, 'price'), Number.NaN);
  const id = event.id() ?? '';
  if (!d || !name || !id || !Number.isFinite(price)) return null;
  return {
    id,
    address: `30009:${operatorPubkey}:${d}`,
    name,
    description: extractTagValue(event, 'description') ?? '',
    price,
    currency: extractTagValues(event, 'price', 2)[0] ?? 'EUR',
    section: extractTagValue(event, 'section') ?? 'Menu',
    productKind: extractTagValue(event, 'product_kind') ?? 'item',
    available: extractTagValue(event, 'availability') !== 'unavailable',
    position: finiteNumber(extractTagValue(event, 'position'), 999),
  };
}

export function projectMembershipOffer(event: ParsedEvent, operatorPubkey: string): RoomMembershipOffer | null {
  if (
    event.kind() !== CRAYS_PROTOCOL.badgeDefinitionKind ||
    event.pubkey() !== operatorPubkey ||
    extractTagValue(event, 'type') !== 'membership'
  ) return null;
  const d = extractTagValue(event, 'd');
  const name = extractTagValue(event, 'name');
  const price = finiteNumber(extractTagValue(event, 'price'), Number.NaN);
  const id = event.id() ?? '';
  if (!d || !name || !id || !Number.isFinite(price)) return null;
  return {
    id,
    address: `30009:${operatorPubkey}:${d}`,
    name,
    description: extractTagValue(event, 'description') ?? '',
    price,
    currency: extractTagValues(event, 'price', 2)[0] ?? 'EUR',
    billing: extractTagValue(event, 'billing') ?? 'one-time',
    available: extractTagValue(event, 'availability') !== 'unavailable',
  };
}

const ENTITLEMENT_TYPES = new Set<RoomEntitlementType>(['product', 'membership', 'pass', 'event_access']);

/** Stable definition copy used after the FlatBuffer callback and after leaving the room. */
export function projectEntitlementDefinition(
  event: ParsedEvent,
  operatorPubkey: string,
): EntitlementDefinitionProjection | null {
  if (event.kind() !== CRAYS_PROTOCOL.badgeDefinitionKind || event.pubkey() !== operatorPubkey) return null;
  const rawType = extractTagValue(event, 'type') as RoomEntitlementType | undefined;
  const d = extractTagValue(event, 'd');
  const id = event.id() ?? '';
  if (!rawType || !ENTITLEMENT_TYPES.has(rawType) || !d || !id) return null;
  const maxUsesRaw = Number(extractTagValue(event, 'max_uses'));
  const maxUses = Number.isSafeInteger(maxUsesRaw) && maxUsesRaw > 0
    ? maxUsesRaw
    : rawType === 'product' ? 1 : undefined;
  return {
    id,
    address: `30009:${operatorPubkey}:${d}`,
    issuerPubkey: operatorPubkey,
    type: rawType,
    name: extractTagValue(event, 'name')?.trim() || d,
    description: extractTagValue(event, 'description')?.trim() || '',
    billing: extractTagValue(event, 'billing'),
    eventAddress: rawType === 'event_access' ? extractTagValue(event, 'a') : undefined,
    maxUses,
  };
}

export function projectCalendarEvent(event: ParsedEvent, operatorPubkey: string): RoomCalendarEvent | null {
  if (!CRAYS_PROTOCOL.calendarKinds.includes(event.kind() as 31922 | 31923) || event.pubkey() !== operatorPubkey) return null;
  const d = extractTagValue(event, 'd');
  const title = extractTagValue(event, 'title');
  const start = finiteNumber(extractTagValue(event, 'start'), Number.NaN);
  const id = event.id() ?? '';
  if (!d || !title || !id || !Number.isFinite(start)) return null;
  const price = finiteNumber(extractTagValue(event, 'price'));
  const capacity = finiteNumber(extractTagValue(event, 'capacity'), Number.NaN);
  const end = finiteNumber(extractTagValue(event, 'end'), Number.NaN);
  return {
    id,
    address: `${event.kind()}:${operatorPubkey}:${d}`,
    title,
    summary: extractTagValue(event, 'summary') ?? '',
    location: extractTagValue(event, 'location') ?? '',
    start,
    end: Number.isFinite(end) ? end : null,
    capacity: Number.isFinite(capacity) ? capacity : null,
    price,
    currency: extractTagValues(event, 'price', 2)[0] ?? 'EUR',
  };
}

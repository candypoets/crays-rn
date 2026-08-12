import { extractTagValue, extractTagValues, type ParsedEvent } from '@candypoets/nipworker';
import { asKind0, asKind1, fbIterable } from '@candypoets/nipworker/utils';

import { CRAYS_PROTOCOL } from '@/nostr/protocol';
import {
  maxUsesForDefinition,
  parsePriceTag,
} from '@/access/nip97';
import type {
  RoomCalendarEvent,
  RoomMembershipOffer,
  RoomPost,
  RoomProduct,
  RoomProfile,
  RoomEntitlementType,
} from '@/rooms/types';
import type { EntitlementDefinitionProjection } from '@/access/entitlements';

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

/** Store menu items are single-use NIP-99 listings; passes and tickets stay in access. */
export function projectRoomProduct(event: ParsedEvent, admins: ReadonlySet<string>): RoomProduct | null {
  if (event.kind() !== CRAYS_PROTOCOL.listingKind || !admins.has(event.pubkey() ?? '')) return null;
  if (extractTagValue(event, 'a') || (maxUsesForDefinition(event.kind(), event) ?? 1) > 1) return null;
  const d = extractTagValue(event, 'd');
  const name = extractTagValue(event, 'title');
  const price = parsePriceTag(event);
  const id = event.id() ?? '';
  if (!d || !name || !id || !price) return null;
  return {
    id,
    address: `${CRAYS_PROTOCOL.listingKind}:${event.pubkey()}:${d}`,
    name,
    description: extractTagValue(event, 'summary') ?? extractTagValue(event, 'description') ?? '',
    price: price.amount,
    currency: price.currency,
    section: extractTagValue(event, 'section') ?? 'Menu',
    productKind: extractTagValue(event, 'product_kind') ?? 'item',
    available: extractTagValue(event, 'availability') !== 'unavailable',
    position: finiteNumber(extractTagValue(event, 'position'), 999),
  };
}

export function projectMembershipOffer(event: ParsedEvent, admins: ReadonlySet<string>): RoomMembershipOffer | null {
  if (
    event.kind() !== CRAYS_PROTOCOL.badgeDefinitionKind ||
    !admins.has(event.pubkey() ?? '') ||
    !extractTagValues(event, 't').includes('membership')
  ) return null;
  const d = extractTagValue(event, 'd');
  const name = extractTagValue(event, 'name');
  const price = parsePriceTag(event);
  const id = event.id() ?? '';
  if (!d || !name || !id || !price) return null;
  const recurrence = price.recurrence;
  return {
    id,
    address: `${CRAYS_PROTOCOL.badgeDefinitionKind}:${event.pubkey()}:${d}`,
    name,
    description: extractTagValue(event, 'description') ?? '',
    price: price.amount,
    currency: price.currency,
    billing: recurrence === 'month' ? 'monthly' : recurrence === 'year' ? 'yearly' : 'one-time',
    available: extractTagValue(event, 'availability') !== 'unavailable',
  };
}

/**
 * NIP-97 definition classification, derived from the event shape rather than
 * a `type` tag: 30009 memberships, 30402 products/passes/tickets, and
 * 31922/31923 events acting as their own free-admission definition.
 */
function entitlementTypeFor(event: ParsedEvent): { type: RoomEntitlementType; eventAddress?: string } | null {
  const kind = event.kind();
  if (kind === CRAYS_PROTOCOL.badgeDefinitionKind) {
    return extractTagValues(event, 't').includes('membership') ? { type: 'membership' } : null;
  }
  if (kind === CRAYS_PROTOCOL.listingKind) {
    const linked = extractTagValue(event, 'a');
    const linkedKind = linked ? Number(linked.split(':')[0]) : undefined;
    if (linked && (CRAYS_PROTOCOL.calendarKinds as readonly number[]).includes(linkedKind ?? 0)) {
      return { type: 'event_access', eventAddress: linked };
    }
    return { type: (maxUsesForDefinition(kind, event) ?? 1) > 1 ? 'pass' : 'product' };
  }
  if (CRAYS_PROTOCOL.calendarKinds.includes(kind as 31922 | 31923)) {
    return { type: 'event_access', eventAddress: `${kind}:${event.pubkey()}:${extractTagValue(event, 'd')}` };
  }
  return null;
}

/** Stable definition copy used after the FlatBuffer callback and after leaving the room. */
export function projectEntitlementDefinition(
  event: ParsedEvent,
  admins: ReadonlySet<string>,
): EntitlementDefinitionProjection | null {
  const author = event.pubkey() ?? '';
  const id = event.id() ?? '';
  if (!admins.has(author) || !id) return null;
  const classified = entitlementTypeFor(event);
  if (!classified) return null;
  const d = extractTagValue(event, 'd');
  if (!d) return null;
  const kind = event.kind();
  const name = kind === CRAYS_PROTOCOL.listingKind
    ? extractTagValue(event, 'title')
    : kind === CRAYS_PROTOCOL.badgeDefinitionKind
      ? extractTagValue(event, 'name')
      : extractTagValue(event, 'title');
  const price = parsePriceTag(event);
  const recurrence = price?.recurrence;
  return {
    id,
    address: `${kind}:${author}:${d}`,
    issuerPubkey: author,
    type: classified.type,
    name: name?.trim() || d,
    description: (extractTagValue(event, 'description') ?? extractTagValue(event, 'summary'))?.trim() || '',
    ...(classified.type === 'membership'
      ? { billing: recurrence === 'month' ? 'monthly' : recurrence === 'year' ? 'yearly' : 'one-time' }
      : {}),
    eventAddress: classified.eventAddress,
    maxUses: maxUsesForDefinition(kind, event),
    sellable: Boolean(price),
  };
}

export function projectCalendarEvent(event: ParsedEvent, admins: ReadonlySet<string>): RoomCalendarEvent | null {
  if (!CRAYS_PROTOCOL.calendarKinds.includes(event.kind() as 31922 | 31923) || !admins.has(event.pubkey() ?? '')) return null;
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
    address: `${event.kind()}:${event.pubkey()}:${d}`,
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

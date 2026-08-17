import type { EventTemplate } from 'nostr-tools';

export const CRAYS_PROTOCOL = {
  appNamespace: 'life.crays',
  roomDefinitionKind: 30312,
  roomPresenceKind: 10312,
  roomFeedKind: 1,
  profileKind: 0,
  badgeAwardKind: 8,
  badgeDefinitionKind: 30009,
  listingKind: 30402,
  anchorKind: 31727,
  eventDeletionKind: 5,
  presentationKind: 27236,
  orderStatusKind: 37237,
  legacyOrderStatusKind: 27237,
  calendarKinds: [31922, 31923] as const,
  rsvpKind: 31925,
} as const;

export const PRESENCE_HEARTBEAT_INTERVAL_MS = 60_000;
export const PRESENCE_FALLBACK_FRESHNESS_SECONDS = 5 * 60;

export type PresenceVisibility = 'visible' | 'quiet';
export type PresenceIntent = 'social' | 'business' | 'dating' | 'curious';

export function roomFeedTemplate(
  roomId: string,
  content: string,
  expiresAt: number,
): EventTemplate {
  return {
    kind: CRAYS_PROTOCOL.roomFeedKind,
    created_at: Math.floor(Date.now() / 1000),
    content,
    tags: [
      ['h', roomId],
      ['client', CRAYS_PROTOCOL.appNamespace],
      ['expiration', String(expiresAt)],
    ],
  };
}

export function communityAnchorAddress(rootPubkey: string): string {
  if (!/^[0-9a-f]{64}$/i.test(rootPubkey)) throw new Error('The community root key is invalid.');
  return `${CRAYS_PROTOCOL.anchorKind}:${rootPubkey.toLowerCase()}:community`;
}

export function roomDefinitionAddress(authorPubkey: string, roomId: string): string {
  if (!/^[0-9a-f]{64}$/i.test(authorPubkey)) throw new Error('The room author key is invalid.');
  if (!roomId.trim()) throw new Error('The room identifier is missing.');
  return `${CRAYS_PROTOCOL.roomDefinitionKind}:${authorPubkey.toLowerCase()}:${roomId}`;
}

function assertRoomDefinitionAddress(roomAddress: string): void {
  if (!/^30312:[0-9a-f]{64}:.+$/i.test(roomAddress)) {
    throw new Error('The NIP-53 room address is invalid.');
  }
}

/** NIP-53 Room Presence bound to the exact kind-30312 meeting space. */
export function presenceTemplate({
  roomAddress,
  relayUrl,
  intent,
  context,
  expiresAt,
}: {
  roomAddress: string;
  relayUrl: string;
  intent: PresenceIntent;
  context?: string;
  expiresAt: number;
}): EventTemplate {
  assertRoomDefinitionAddress(roomAddress);
  const normalizedContext = context?.trim().slice(0, 80) ?? '';
  return {
    kind: CRAYS_PROTOCOL.roomPresenceKind,
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [
      ['a', roomAddress, relayUrl, 'root'],
      ['intent', intent],
      ...(normalizedContext ? [['context', normalizedContext]] : []),
      ['expiration', String(expiresAt)],
    ],
  };
}

/** A newer same-kind/same-author replacement makes leave visible immediately. */
export function leaveTemplate({
  roomAddress,
  relayUrl,
  expiresAt,
}: {
  roomAddress: string;
  relayUrl: string;
  expiresAt: number;
}): EventTemplate {
  assertRoomDefinitionAddress(roomAddress);
  return {
    kind: CRAYS_PROTOCOL.roomPresenceKind,
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [
      ['a', roomAddress, relayUrl, 'root'],
      ['status', 'left'],
      ['expiration', String(expiresAt)],
    ],
  };
}

export function eventRsvpTemplate(eventAddress: string, status: 'accepted' | 'tentative' | 'declined'): EventTemplate {
  return {
    kind: CRAYS_PROTOCOL.rsvpKind,
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [['a', eventAddress], ['status', status], ['d', eventAddress]],
  };
}

export function venueReportTemplate(targetPubkey: string, roomId: string, reason = 'other', eventId?: string): EventTemplate {
  return {
    kind: 1984,
    created_at: Math.floor(Date.now() / 1000),
    content: 'Reported from Crays safety controls.',
    tags: [['p', targetPubkey, reason], ...(eventId ? [['e', eventId, reason]] : []), ['h', roomId], ['client', CRAYS_PROTOCOL.appNamespace]],
  };
}

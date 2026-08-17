import type { EventTemplate } from 'nostr-tools';

export const CRAYS_PROTOCOL = {
  appNamespace: 'life.crays',
  roomDefinitionKind: 30312,
  roomPresenceKind: 10312,
  roomFeedKind: 1,
  reactionKind: 7,
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

export type RoomPostMedia = {
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sha256?: string;
  alt?: string;
};

export type RoomReplyTarget = {
  id: string;
  pubkey: string;
  participantPubkeys?: readonly string[];
  rootId?: string;
  rootPubkey?: string;
};

function uniqueValues(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function roomPostContent(content: string, media: readonly RoomPostMedia[]): string {
  return [content.trim(), ...media.map((item) => item.url)].filter(Boolean).join('\n');
}

function roomMediaTags(media: readonly RoomPostMedia[]): string[][] {
  return media.map((item) => [
    'imeta',
    `url ${item.url}`,
    ...(item.mimeType ? [`m ${item.mimeType}`] : []),
    ...(item.width && item.height ? [`dim ${Math.round(item.width)}x${Math.round(item.height)}`] : []),
    ...(item.sha256 ? [`x ${item.sha256}`] : []),
    ...(item.alt ? [`alt ${item.alt}`] : []),
  ]);
}

function roomPostBaseTags(roomId: string, expiresAt: number, media: readonly RoomPostMedia[]): string[][] {
  return [
    ['h', roomId],
    ['client', CRAYS_PROTOCOL.appNamespace],
    ['expiration', String(expiresAt)],
    ...roomMediaTags(media),
  ];
}

export const PRESENCE_HEARTBEAT_INTERVAL_MS = 60_000;
export const PRESENCE_FALLBACK_FRESHNESS_SECONDS = 5 * 60;

export type PresenceVisibility = 'visible' | 'quiet';
export type PresenceIntent = 'social' | 'business' | 'dating' | 'curious';

export function roomFeedTemplate(
  roomId: string,
  content: string,
  expiresAt: number,
  media: readonly RoomPostMedia[] = [],
): EventTemplate {
  return {
    kind: CRAYS_PROTOCOL.roomFeedKind,
    created_at: Math.floor(Date.now() / 1000),
    content: roomPostContent(content, media),
    tags: roomPostBaseTags(roomId, expiresAt, media),
  };
}

/** NIP-10 reply kept inside the active room's pinned relay and expiry lease. */
export function roomReplyTemplate({
  roomId,
  relayUrl,
  content,
  expiresAt,
  parent,
  media = [],
}: {
  roomId: string;
  relayUrl: string;
  content: string;
  expiresAt: number;
  parent: RoomReplyTarget;
  media?: readonly RoomPostMedia[];
}): EventTemplate {
  const rootId = parent.rootId || parent.id;
  const rootPubkey = parent.rootPubkey || parent.pubkey;
  const nested = rootId !== parent.id;
  const participantPubkeys = uniqueValues([
    parent.pubkey,
    rootPubkey,
    ...(parent.participantPubkeys || []),
  ]);
  return {
    kind: CRAYS_PROTOCOL.roomFeedKind,
    created_at: Math.floor(Date.now() / 1000),
    content: roomPostContent(content, media),
    tags: [
      ['e', rootId, relayUrl, 'root', rootPubkey],
      ...(nested ? [['e', parent.id, relayUrl, 'reply', parent.pubkey]] : []),
      ...participantPubkeys.map((pubkey) => ['p', pubkey, relayUrl]),
      ...roomPostBaseTags(roomId, expiresAt, media),
    ],
  };
}

/** NIP-25 like; room and expiry tags keep the reaction in the same lease. */
export function roomReactionTemplate({
  roomId,
  relayUrl,
  targetId,
  targetPubkey,
  expiresAt,
}: {
  roomId: string;
  relayUrl: string;
  targetId: string;
  targetPubkey: string;
  expiresAt: number;
}): EventTemplate {
  return {
    kind: CRAYS_PROTOCOL.reactionKind,
    created_at: Math.floor(Date.now() / 1000),
    content: '+',
    tags: [
      ['e', targetId, relayUrl, targetPubkey],
      ['p', targetPubkey, relayUrl],
      ['k', String(CRAYS_PROTOCOL.roomFeedKind)],
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

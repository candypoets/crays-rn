import type { EventTemplate } from 'nostr-tools';

/**
 * Stable NIP kinds stay literal. The unresolved room primitives use NIP-78's
 * application-data kinds and a versioned namespace so pilot data can migrate
 * without being mistaken for a standardized NIP.
 */
export const CRAYS_PROTOCOL = {
  appNamespace: 'life.crays',
  roomManifestKind: 30078,
  roomActivityKind: 78,
  roomFeedKind: 1,
  profileKind: 0,
  badgeAwardKind: 8,
  badgeDefinitionKind: 30009,
  eventDeletionKind: 5,
  presentationKind: 27236,
  orderStatusKind: 37237,
  legacyOrderStatusKind: 27237,
  calendarKinds: [31922, 31923] as const,
  rsvpKind: 31925,
} as const;

export const pilotD = {
  room: (roomId: string) => `${CRAYS_PROTOCOL.appNamespace}/room/v1/${roomId}`,
  presence: (roomId: string, pubkey: string) =>
    `${CRAYS_PROTOCOL.appNamespace}/presence/v1/${roomId}/${pubkey}`,
} as const;

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

export function presenceTemplate({
  roomId,
  pubkey,
  visibility,
  intent,
  context,
  expiresAt,
}: {
  roomId: string;
  pubkey: string;
  visibility: PresenceVisibility;
  intent?: PresenceIntent;
  context?: string;
  expiresAt: number;
}): EventTemplate {
  const normalizedContext = context?.trim().slice(0, 80) ?? '';
  return {
    kind: CRAYS_PROTOCOL.roomActivityKind,
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [
      ['d', pilotD.presence(roomId, pubkey)],
      ['h', roomId],
      ['type', 'presence'],
      ['visibility', visibility],
      ...(visibility === 'visible' && intent ? [['intent', intent]] : []),
      ...(visibility === 'visible' && normalizedContext ? [['context', normalizedContext]] : []),
      ['expiration', String(expiresAt)],
      ['schema', 'life.crays/presence/v1'],
    ],
  };
}

export function leaveTemplate(roomId: string, pubkey: string): EventTemplate {
  return {
    kind: CRAYS_PROTOCOL.roomActivityKind,
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [
      ['d', pilotD.presence(roomId, pubkey)],
      ['h', roomId],
      ['type', 'presence'],
      ['status', 'left'],
      ['expiration', String(Math.floor(Date.now() / 1000) + 60)],
      ['schema', 'life.crays/presence/v1'],
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

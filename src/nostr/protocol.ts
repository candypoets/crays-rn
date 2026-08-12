import type { EventTemplate } from 'nostr-tools';

/**
 * Stable NIP kinds stay literal. `roomManifestKind` exposes the remaining
 * pre-migration discovery pilot only so existing screens can remove it in a
 * deliberate cut-over. It is not authoritative community/discovery semantics
 * and MUST NOT be copied into new product or relay contracts.
 */
export const CRAYS_PROTOCOL = {
  appNamespace: 'life.crays',
  /** @deprecated Legacy Crays pilot; community identity belongs in NIP-97 kind 31727. */
  roomManifestKind: 30078,
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

/** @deprecated Address for the remaining legacy kind-30078 room selector. */
export const pilotD = {
  room: (roomId: string) => `${CRAYS_PROTOCOL.appNamespace}/room/v1/${roomId}`,
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

export function communityAnchorAddress(rootPubkey: string): string {
  if (!/^[0-9a-f]{64}$/i.test(rootPubkey)) throw new Error('The community root key is invalid.');
  return `${CRAYS_PROTOCOL.anchorKind}:${rootPubkey.toLowerCase()}:community`;
}

/** NIP-53 Room Presence bound to the root-signed NIP-97 community anchor. */
export function presenceTemplate({
  communityRootPubkey,
  relayUrl,
  intent,
  context,
  expiresAt,
}: {
  communityRootPubkey: string;
  relayUrl: string;
  intent: PresenceIntent;
  context?: string;
  expiresAt: number;
}): EventTemplate {
  const normalizedContext = context?.trim().slice(0, 80) ?? '';
  return {
    kind: CRAYS_PROTOCOL.roomPresenceKind,
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [
      ['a', communityAnchorAddress(communityRootPubkey), relayUrl, 'root'],
      ['intent', intent],
      ...(normalizedContext ? [['context', normalizedContext]] : []),
      ['expiration', String(expiresAt)],
    ],
  };
}

/** A newer same-kind/same-author replacement makes leave visible immediately. */
export function leaveTemplate({
  communityRootPubkey,
  relayUrl,
  expiresAt,
}: {
  communityRootPubkey: string;
  relayUrl: string;
  expiresAt: number;
}): EventTemplate {
  return {
    kind: CRAYS_PROTOCOL.roomPresenceKind,
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [
      ['a', communityAnchorAddress(communityRootPubkey), relayUrl, 'root'],
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

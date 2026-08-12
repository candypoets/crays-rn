import { extractTagValue, type ParsedEvent } from '@candypoets/nipworker';

import {
  CRAYS_PROTOCOL,
  PRESENCE_FALLBACK_FRESHNESS_SECONDS,
} from '@/nostr/protocol';

export type RoomPresenceProjection = {
  id: string;
  pubkey: string;
  intent: string;
  context: string;
  expiresAt: number;
  createdAt: number;
  visible: boolean;
};

/**
 * Reduce a NIP-53 room-presence FlatBuffer to the minimum stable roster input.
 * The exact NIP-53 kind-30312 address is the room boundary; other event kinds
 * and presence for another room are rejected.
 */
export function projectRoomPresence(
  event: ParsedEvent,
  roomAddress: string,
  now = Math.floor(Date.now() / 1000),
): RoomPresenceProjection | null {
  if (
    event.kind() !== CRAYS_PROTOCOL.roomPresenceKind ||
    extractTagValue(event, 'a') !== roomAddress
  ) return null;

  const id = event.id() ?? '';
  const pubkey = event.pubkey() ?? '';
  const createdAt = event.createdAt();
  const expirationTag = extractTagValue(event, 'expiration');
  const expiresAt = expirationTag === undefined
    ? createdAt + PRESENCE_FALLBACK_FRESHNESS_SECONDS
    : Number(expirationTag);
  if (
    !id ||
    !pubkey ||
    !Number.isSafeInteger(createdAt) ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= 0
  ) return null;

  const intent = (extractTagValue(event, 'intent') ?? '').trim().slice(0, 40) || 'Open to chat';
  const context = (extractTagValue(event, 'context') ?? '').trim().slice(0, 80);
  return {
    id,
    pubkey,
    intent,
    context,
    expiresAt,
    createdAt,
    visible: extractTagValue(event, 'status') !== 'left' && expiresAt > now,
  };
}

/** NIP-01 replacement tie-break: newest timestamp, then lowest event id. */
export function isNewerRoomPresence(
  candidate: RoomPresenceProjection,
  current: RoomPresenceProjection,
): boolean {
  return candidate.createdAt > current.createdAt || (
    candidate.createdAt === current.createdAt && candidate.id.localeCompare(current.id) < 0
  );
}

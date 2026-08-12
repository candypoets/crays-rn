import {
  extractTagValue,
  extractTagValues,
  readStringVec,
  type ParsedEvent,
} from '@candypoets/nipworker';

import { CRAYS_PROTOCOL, communityAnchorAddress, roomDefinitionAddress } from '@/nostr/protocol';
import type { RoomCapability, RoomDescriptor } from '@/rooms/types';
import type { CommunityTrust } from '@/rooms/trust';

const CAPABILITIES = new Set<RoomCapability>(['social', 'menu', 'events', 'membership']);
const STATUSES = new Set<RoomDescriptor['status']>(['open', 'private', 'closed']);

function hasHostProvider(event: ParsedEvent): boolean {
  for (let index = 0; index < event.tagsLength(); index += 1) {
    const tag = event.tags(index);
    if (!tag) continue;
    const values = readStringVec(tag);
    if (
      values[0] === 'p' &&
      /^[0-9a-f]{64}$/i.test(values[1] ?? '') &&
      values[3]?.toLowerCase() === 'host'
    ) return true;
  }
  return false;
}

function isServiceUrl(value: string): boolean {
  try {
    return ['http:', 'https:', 'ws:', 'wss:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isRelayUrl(value: string): boolean {
  try {
    return ['ws:', 'wss:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * Project the minimum stable NIP-53 room input after NIP-11 + NIP-97 trust
 * has resolved. The pinned relay is authoritative; event relay hints are not.
 */
export function projectRoomDefinition(
  event: ParsedEvent,
  trust: CommunityTrust,
  pinnedRelayUrl: string,
): RoomDescriptor | null {
  if (event.kind() !== CRAYS_PROTOCOL.roomDefinitionKind) return null;
  const author = event.pubkey() ?? '';
  if (author !== trust.rootPubkey && !trust.admins.has(author)) return null;

  const id = extractTagValue(event, 'd')?.trim() ?? '';
  const name = extractTagValue(event, 'room')?.trim() ?? '';
  const status = extractTagValue(event, 'status') as RoomDescriptor['status'] | undefined;
  const serviceUrl = extractTagValue(event, 'service')?.trim() ?? '';
  const preferredRelayUrl = extractTagValue(event, 'relays')?.trim() ?? '';
  if (
    !event.id() ||
    !id ||
    !name ||
    !status ||
    !STATUSES.has(status) ||
    !isServiceUrl(serviceUrl) ||
    !hasHostProvider(event)
  ) return null;

  const capabilities = extractTagValues(event, 't').filter(
    (value: string): value is RoomCapability => CAPABILITIES.has(value as RoomCapability),
  );
  return {
    id,
    address: roomDefinitionAddress(author, id),
    communityAddress: communityAnchorAddress(trust.rootPubkey),
    rootPubkey: trust.rootPubkey,
    name,
    about: extractTagValue(event, 'summary')?.trim() ?? '',
    image: extractTagValue(event, 'image')?.trim() || undefined,
    // The input relay remains the trust/transport pin. An authorized NIP-53
    // preferred relay is retained as canonical room metadata when present;
    // RoomSession separately persists the actual device transport override.
    relayUrl: isRelayUrl(preferredRelayUrl) ? preferredRelayUrl : pinnedRelayUrl,
    operatorPubkey: author,
    serviceUrl,
    capabilities: [...new Set(capabilities)],
    status,
    open: status !== 'closed',
    verified: true,
  };
}

export type VersionedRoomDefinition = {
  eventId: string;
  createdAt: number;
  room: RoomDescriptor;
};

export function isNewerRoomDefinition(
  candidate: VersionedRoomDefinition,
  current: VersionedRoomDefinition,
): boolean {
  return candidate.createdAt > current.createdAt || (
    candidate.createdAt === current.createdAt && candidate.eventId.localeCompare(current.eventId) < 0
  );
}

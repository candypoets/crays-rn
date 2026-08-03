import type { RoomDescriptor } from './types';

type RelayRoutedRoom = Pick<RoomDescriptor, 'relayUrl'> & { connectionRelayUrl?: string };

/** Device transport URL when present; the signed relayUrl remains authoritative metadata. */
export function relayUrlFor(room: RelayRoutedRoom): string {
  return room.connectionRelayUrl || room.relayUrl;
}

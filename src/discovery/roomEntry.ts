import {
  decodeNearbyRoomPointer,
  nearbyRoomEntryParams,
  parseNearbyRoomPointer,
  type NearbyRoomEntryParams,
} from '@/discovery/blePointer';

function pointerFromUrl(value: string) {
  try {
    const url = new URL(value);
    const relay = url.searchParams.get('relay');
    const room = url.searchParams.get('room');
    const service = url.searchParams.get('service');
    const token = url.searchParams.get('token');
    return parseNearbyRoomPointer({
      v: service || token ? 2 : 1,
      relay,
      room,
      service,
      token,
    });
  } catch {
    return null;
  }
}

/**
 * Parse the transport pointer carried by a venue QR. Display identity never
 * comes from this value; the destination resolves the room through NIP-11,
 * the NIP-97 anchor, and the authorized kind-30312 definition.
 */
export function parseRoomEntryCode(value: string): NearbyRoomEntryParams | null {
  const input = value.trim();
  if (!input || input.length > 8192) return null;
  let pointer = pointerFromUrl(input);
  if (!pointer) {
    try {
      pointer = parseNearbyRoomPointer(JSON.parse(input));
    } catch {
      pointer = decodeNearbyRoomPointer(input);
    }
  }
  return pointer ? nearbyRoomEntryParams(pointer) : null;
}

export function roomMapSearchUrl(roomName?: string): string {
  const query = roomName?.trim() || 'nightlife near me';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export type NearbyRoomInvite = {
  serviceUrl: string;
  token: string;
};

export type NearbyRoomPointerValue = {
  relayUrl: string;
  roomId: string;
  invite?: NearbyRoomInvite;
};

export type NearbyRoomEntryParams = {
  relay: string;
  room: string;
  service?: string;
  token?: string;
};

export type NearbyRoomPointerWire =
  | { v: 1; relay: string; room: string }
  | { v: 2; relay: string; room: string; service: string; token: string };

const ROOM_ID = /^[a-z0-9][a-z0-9._-]{1,127}$/i;
const INVITE_TOKEN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function websocketUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 2048 && /^wss?:\/\//.test(value);
}

function serviceUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Parse the decoded GATT value; shared by physical BLE and the test-build fixture. */
export function parseNearbyRoomPointer(value: unknown): NearbyRoomPointerValue | null {
  const pointer = value as { v?: unknown; relay?: unknown; room?: unknown; service?: unknown; token?: unknown };
  if (!websocketUrl(pointer?.relay) || typeof pointer.room !== 'string' || !ROOM_ID.test(pointer.room)) return null;
  if (pointer.v === 1) return { relayUrl: pointer.relay, roomId: pointer.room };
  if (
    pointer.v !== 2 ||
    !serviceUrl(pointer.service) ||
    typeof pointer.token !== 'string' ||
    pointer.token.length > 4096 ||
    !INVITE_TOKEN.test(pointer.token)
  ) return null;
  return {
    relayUrl: pointer.relay,
    roomId: pointer.room,
    invite: { serviceUrl: pointer.service, token: pointer.token },
  };
}

export function nearbyRoomEntryParams(pointer: NearbyRoomPointerValue): NearbyRoomEntryParams {
  return {
    relay: pointer.relayUrl,
    room: pointer.roomId,
    ...(pointer.invite ? { service: pointer.invite.serviceUrl, token: pointer.invite.token } : {}),
  };
}

/** Encode the exact GATT characteristic payload used by a physical gateway. */
export function encodeNearbyRoomPointer(
  value: NearbyRoomPointerWire,
  encodeBase64: (value: string) => string = globalThis.btoa,
): string | null {
  if (typeof encodeBase64 !== 'function' || !parseNearbyRoomPointer(value)) return null;
  try {
    const encoded = encodeBase64(JSON.stringify(value));
    return encoded.length <= 8192 ? encoded : null;
  } catch {
    return null;
  }
}

/**
 * Decode the versioned, base64-encoded value exposed by a Crays gateway.
 * This function is intentionally native-module-free so malformed gateway data
 * can be tested without a Bluetooth adapter.
 */
export function decodeNearbyRoomPointer(
  encoded: string | null,
  decodeBase64: (value: string) => string = globalThis.atob,
): NearbyRoomPointerValue | null {
  if (!encoded || encoded.length > 8192 || typeof decodeBase64 !== 'function') return null;
  try {
    return parseNearbyRoomPointer(JSON.parse(decodeBase64(encoded)));
  } catch {
    return null;
  }
}

import {
  decodeNearbyRoomPointer,
  encodeNearbyRoomPointer,
  nearbyRoomEntryParams,
  type NearbyRoomEntryParams,
  type NearbyRoomPointerValue,
} from '@/discovery/blePointer';

export const TEST_ROOM_ID = process.env.EXPO_PUBLIC_CRAYS_TEST_ROOM_ID || 'crays-test-room';
export const TEST_ROOM_RELAY_URL = process.env.EXPO_PUBLIC_CRAYS_TEST_RELAY_URL
  || 'wss://crays-test.relays.nuts.cash';
export const TEST_ROOM_SERVICE_URL = process.env.EXPO_PUBLIC_CRAYS_TEST_ROOM_SERVICE_URL
  || 'https://crays-test.relays.nuts.cash';

/**
 * EXPO_PUBLIC values are compiled into the native JS bundle. The Test Room
 * token is deliberately a public, broadcast membership credential—not a
 * runtime secret and not a dependency on a developer-hosted proxy.
 */
export const TEST_ROOM_INVITE_TOKEN = process.env.EXPO_PUBLIC_CRAYS_TEST_ROOM_INVITE_TOKEN || '';
export const TEST_ROOM_BUILD = __DEV__ || process.env.EXPO_PUBLIC_CRAYS_TEST_BUILD === '1';

type TestRoomPointerInput = {
  relayUrl: string;
  roomId: string;
  serviceUrl: string;
  token: string;
};

let qaPointerOverride: TestRoomPointerInput | null = null;

/** Inject a per-run credential into the development-only native QA route. */
export function setQaTestRoomPointer(input: TestRoomPointerInput | null): boolean {
  if (!__DEV__) return false;
  qaPointerOverride = input;
  return true;
}

export function createTestRoomPointer({
  relayUrl = qaPointerOverride?.relayUrl || TEST_ROOM_RELAY_URL,
  roomId = qaPointerOverride?.roomId || TEST_ROOM_ID,
  serviceUrl = qaPointerOverride?.serviceUrl || TEST_ROOM_SERVICE_URL,
  token = qaPointerOverride?.token || TEST_ROOM_INVITE_TOKEN,
}: {
  relayUrl?: string;
  roomId?: string;
  serviceUrl?: string;
  token?: string;
} = {}): NearbyRoomPointerValue | null {
  if (!TEST_ROOM_BUILD || !token) return null;
  const encoded = encodeNearbyRoomPointer({
    v: 2,
    relay: relayUrl,
    room: roomId,
    service: serviceUrl,
    token,
  });
  return encoded ? decodeNearbyRoomPointer(encoded) : null;
}

export function testRoomEntryParams(pointer = createTestRoomPointer()): NearbyRoomEntryParams | null {
  return pointer ? nearbyRoomEntryParams(pointer) : null;
}

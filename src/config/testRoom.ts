export const DEV_TEST_ROOM_ID = process.env.EXPO_PUBLIC_CRAYS_TEST_ROOM_ID || 'crays-test-room';

// The development fixture is backed by the reserved live relay. A local
// proxy remains an explicit opt-in for hosts/devices that cannot reach it.
export const DEV_TEST_RELAY_URL = process.env.EXPO_PUBLIC_CRAYS_TEST_RELAY_URL
  || 'wss://crays-test.relays.nuts.cash';

export function devTestRoomEntryParams(): { relay: string; room: string } {
  return { relay: DEV_TEST_RELAY_URL, room: DEV_TEST_ROOM_ID };
}

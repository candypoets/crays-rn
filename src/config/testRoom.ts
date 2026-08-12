export const DEV_TEST_ROOM_ID = process.env.EXPO_PUBLIC_CRAYS_TEST_ROOM_ID || 'crays-test-room';

// The development fixture is backed by the reserved live relay. A local
// proxy remains an explicit opt-in for hosts/devices that cannot reach it.
export const DEV_TEST_RELAY_URL = process.env.EXPO_PUBLIC_CRAYS_TEST_RELAY_URL
  || 'wss://crays-test.relays.nuts.cash';

/**
 * A QA deep link may point the development card at a per-run proxy when the
 * conventional port belongs to another worktree. Invalid or non-WebSocket
 * values deliberately fall back to the configured development relay.
 */
export function resolveDevTestRelayUrl(override?: string) {
  if (!override) return DEV_TEST_RELAY_URL;
  try {
    const url = new URL(override);
    if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password) return DEV_TEST_RELAY_URL;
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return DEV_TEST_RELAY_URL;
  }
}

export function devTestRoomEntryParams(
  relay = DEV_TEST_RELAY_URL,
): { relay: string; room: string } {
  return { relay, room: DEV_TEST_ROOM_ID };
}

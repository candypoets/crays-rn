import { Platform } from 'react-native';

export const DEV_TEST_ROOM_ID = process.env.EXPO_PUBLIC_CRAYS_TEST_ROOM_ID || 'crays-test-room';

export const DEV_TEST_RELAY_URL = process.env.EXPO_PUBLIC_CRAYS_TEST_RELAY_URL || Platform.select({
  android: 'ws://10.0.2.2:8787',
  default: 'ws://127.0.0.1:8787',
}) || 'ws://127.0.0.1:8787';

export const DEV_TEST_ROOM_INVITE_URL = process.env.EXPO_PUBLIC_CRAYS_TEST_ROOM_INVITE_URL
  || `${DEV_TEST_RELAY_URL.replace(/^ws/, 'http').replace(/\/$/, '')}/invite`;

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

export function resolveDevTestInviteUrl(relayUrl: string) {
  if (relayUrl === DEV_TEST_RELAY_URL) return DEV_TEST_ROOM_INVITE_URL;
  return `${relayUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/$/, '')}/invite`;
}

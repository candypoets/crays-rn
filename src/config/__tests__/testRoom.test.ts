import {
  DEV_TEST_RELAY_URL,
  DEV_TEST_ROOM_INVITE_URL,
  resolveDevTestInviteUrl,
  resolveDevTestRelayUrl,
} from '../testRoom';

describe('development Test Room endpoints', () => {
  it('keeps the configured endpoints when no per-run override is supplied', () => {
    expect(resolveDevTestRelayUrl()).toBe(DEV_TEST_RELAY_URL);
    expect(resolveDevTestInviteUrl(DEV_TEST_RELAY_URL)).toBe(DEV_TEST_ROOM_INVITE_URL);
  });

  it('normalizes a valid per-run WebSocket relay and derives its invite URL', () => {
    const relayUrl = resolveDevTestRelayUrl('ws://10.0.2.2:8788/');

    expect(relayUrl).toBe('ws://10.0.2.2:8788');
    expect(resolveDevTestInviteUrl(relayUrl)).toBe('http://10.0.2.2:8788/invite');
  });

  it.each(['http://10.0.2.2:8788', 'not a URL', 'ws://user:secret@10.0.2.2:8788'])(
    'rejects unsafe QA relay override %s',
    (override) => expect(resolveDevTestRelayUrl(override)).toBe(DEV_TEST_RELAY_URL),
  );
});

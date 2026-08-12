import {
  devTestRoomEntryParams,
  DEV_TEST_RELAY_URL,
  resolveDevTestRelayUrl,
} from '../testRoom';

describe('development Test Room entry', () => {
  it('keeps the configured relay when no per-run override is supplied', () => {
    expect(resolveDevTestRelayUrl()).toBe(DEV_TEST_RELAY_URL);
  });

  it('normalizes a valid per-run WebSocket relay', () => {
    const relayUrl = resolveDevTestRelayUrl('ws://10.0.2.2:8788/');

    expect(relayUrl).toBe('ws://10.0.2.2:8788');
  });

  it.each(['http://10.0.2.2:8788', 'not a URL', 'ws://user:secret@10.0.2.2:8788'])(
    'rejects unsafe QA relay override %s',
    (override) => expect(resolveDevTestRelayUrl(override)).toBe(DEV_TEST_RELAY_URL),
  );

  it('builds a room pointer without an invite handoff', () => {
    const params = devTestRoomEntryParams();

    expect(params.relay).toMatch(/^wss?:\/\//);
    expect(params.room).toBe('crays-test-room');
    expect(params).not.toHaveProperty('invite');
  });

  it('uses a validated per-run relay without adding an invite', () => {
    const relayUrl = resolveDevTestRelayUrl('ws://10.0.2.2:8788/');
    const params = devTestRoomEntryParams(relayUrl);

    expect(params).toEqual({ relay: 'ws://10.0.2.2:8788', room: 'crays-test-room' });
  });
});

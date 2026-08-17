import { canOpenRoomSubscriptions } from '@/rooms/relayAuthGate';

describe('room relay auth gate', () => {
  const relay = 'wss://venue.example';
  const pubkey = 'a'.repeat(64);

  it('lets anonymous sessions open public room subscriptions', () => {
    expect(canOpenRoomSubscriptions(null, relay, null)).toBe(true);
  });

  it('keeps identified sessions closed until the matching private lease is ready', () => {
    expect(canOpenRoomSubscriptions(pubkey, relay, null)).toBe(false);
    expect(canOpenRoomSubscriptions(pubkey, relay, { key: `${pubkey}:${relay}`, status: 'pending' })).toBe(false);
    expect(canOpenRoomSubscriptions(pubkey, relay, { key: `${pubkey}:wss://other.example`, status: 'ready' })).toBe(false);
    expect(canOpenRoomSubscriptions(pubkey, relay, { key: `${pubkey}:${relay}`, status: 'ready' })).toBe(true);
  });
});

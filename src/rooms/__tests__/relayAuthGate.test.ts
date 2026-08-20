import { canOpenRoomSubscriptions, roomSignerAvailable } from '@/rooms/relayAuthGate';

describe('room relay auth gate', () => {
  const relay = 'wss://venue.example';
  const pubkey = 'a'.repeat(64);

  it('lets anonymous sessions open public room subscriptions', () => {
    expect(canOpenRoomSubscriptions(null, relay, null)).toBe(true);
  });

  it('keeps identified sessions closed only until the matching private request starts', () => {
    expect(canOpenRoomSubscriptions(pubkey, relay, null)).toBe(false);
    expect(canOpenRoomSubscriptions(pubkey, relay, { key: `${pubkey}:${relay}`, status: 'pending' })).toBe(false);
    expect(canOpenRoomSubscriptions(pubkey, relay, { key: `${pubkey}:${relay}`, status: 'started' })).toBe(true);
    expect(canOpenRoomSubscriptions(pubkey, relay, { key: `${pubkey}:${relay}`, status: 'failed' })).toBe(true);
    expect(canOpenRoomSubscriptions(pubkey, relay, { key: `${pubkey}:wss://other.example`, status: 'ready' })).toBe(false);
    expect(canOpenRoomSubscriptions(pubkey, relay, { key: `${pubkey}:${relay}`, status: 'ready' })).toBe(true);
  });

  it('accepts the matching signer only after the manager auth callback resolves', () => {
    expect(roomSignerAvailable(pubkey, { hasSigner: true, pubkey, resolved: false })).toBe(false);
    expect(roomSignerAvailable(pubkey, { hasSigner: true, pubkey, resolved: true })).toBe(true);
  });

  it('rejects read-only and mismatched manager auth callbacks', () => {
    expect(roomSignerAvailable(pubkey, { hasSigner: false, pubkey, resolved: true })).toBe(false);
    expect(roomSignerAvailable(pubkey, { hasSigner: true, pubkey: 'b'.repeat(64), resolved: true })).toBe(false);
  });
});

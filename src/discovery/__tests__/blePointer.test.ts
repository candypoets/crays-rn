import { decodeNearbyRoomPointer } from '@/discovery/blePointer';

const encode = (value: unknown) => globalThis.btoa(JSON.stringify(value));
const decode = (value: string) => globalThis.atob(value);

describe('BLE room pointer contract', () => {
  it('accepts only the versioned relay and room payload', () => {
    expect(decodeNearbyRoomPointer(encode({ v: 1, relay: 'wss://relay.example', room: 'skyline.01' }), decode)).toEqual({
      relayUrl: 'wss://relay.example',
      roomId: 'skyline.01',
    });
  });

  it.each([
    null,
    'not-base64-json',
    encode({ v: 2, relay: 'wss://relay.example', room: 'skyline' }),
    encode({ v: 1, relay: 'https://relay.example', room: 'skyline' }),
    encode({ v: 1, relay: 'wss://relay.example', room: '../skyline' }),
    encode({ v: 1, relay: 'wss://relay.example', room: 'x'.repeat(129) }),
  ])('rejects malformed or unsupported gateway data', (value) => {
    expect(decodeNearbyRoomPointer(value, decode)).toBeNull();
  });
});

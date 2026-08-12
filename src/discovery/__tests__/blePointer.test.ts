import { decodeNearbyRoomPointer, encodeNearbyRoomPointer, nearbyRoomEntryParams } from '@/discovery/blePointer';

const encode = (value: unknown) => globalThis.btoa(JSON.stringify(value));
const decode = (value: string) => globalThis.atob(value);

describe('BLE room pointer contract', () => {
  it('keeps a v1 pointer as legacy discovery without room access', () => {
    expect(decodeNearbyRoomPointer(encode({ v: 1, relay: 'wss://relay.example', room: 'skyline.01' }), decode)).toEqual({
      relayUrl: 'wss://relay.example',
      roomId: 'skyline.01',
    });
  });

  it('carries a direct room invite through the v2 nearby entry contract', () => {
    const wire = {
      v: 2,
      relay: 'wss://relay.example',
      room: 'skyline.01',
      service: 'https://relay.example',
      token: 'claims.signature',
    } as const;
    const encoded = encodeNearbyRoomPointer(wire);
    const pointer = decodeNearbyRoomPointer(encoded, decode);

    expect(encoded).toBe(encode(wire));
    expect(pointer).toEqual({
      relayUrl: 'wss://relay.example',
      roomId: 'skyline.01',
      invite: { serviceUrl: 'https://relay.example', token: 'claims.signature' },
    });
    expect(nearbyRoomEntryParams(pointer!)).toEqual({
      relay: 'wss://relay.example',
      room: 'skyline.01',
      service: 'https://relay.example',
      token: 'claims.signature',
    });
  });

  it.each([
    null,
    'not-base64-json',
    encode({ v: 2, relay: 'wss://relay.example', room: 'skyline' }),
    encode({ v: 2, relay: 'wss://relay.example', room: 'skyline', service: 'https://relay.example', token: 'raw-bearer-without-signature' }),
    encode({ v: 2, relay: 'wss://relay.example', room: 'skyline', service: 'wss://relay.example', token: 'claims.signature' }),
    encode({ v: 1, relay: 'https://relay.example', room: 'skyline' }),
    encode({ v: 1, relay: 'wss://relay.example', room: '../skyline' }),
    encode({ v: 1, relay: 'wss://relay.example', room: 'x'.repeat(129) }),
  ])('rejects malformed or unsupported gateway data', (value) => {
    expect(decodeNearbyRoomPointer(value, decode)).toBeNull();
  });
});

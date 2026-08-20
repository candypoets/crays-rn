import { parseRoomEntryCode, roomMapSearchUrl } from '@/discovery/roomEntry';

describe('room entry handoffs', () => {
  it('accepts URL, JSON, and encoded venue pointers', () => {
    const relay = 'wss://relay.example';
    const expected = { relay, room: 'skyline' };
    expect(parseRoomEntryCode(`crays://room?relay=${encodeURIComponent(relay)}&room=skyline`)).toEqual(expected);
    expect(parseRoomEntryCode(JSON.stringify({ v: 1, relay, room: 'skyline' }))).toEqual(expected);
    expect(parseRoomEntryCode(globalThis.btoa(JSON.stringify({ v: 1, relay, room: 'skyline' })))).toEqual(expected);
  });

  it('preserves a complete invite but rejects malformed and partial pointers', () => {
    expect(parseRoomEntryCode(JSON.stringify({
      v: 2,
      relay: 'wss://relay.example',
      room: 'skyline',
      service: 'https://venue.example',
      token: 'claims.signature',
    }))).toEqual({
      relay: 'wss://relay.example',
      room: 'skyline',
      service: 'https://venue.example',
      token: 'claims.signature',
    });
    expect(parseRoomEntryCode('https://venue.example/?relay=https%3A%2F%2Fbad&room=skyline')).toBeNull();
    expect(parseRoomEntryCode('{')).toBeNull();
  });

  it('builds an external map search without treating map listings as verified', () => {
    expect(roomMapSearchUrl(' The Skyline Room ')).toBe('https://www.google.com/maps/search/?api=1&query=The%20Skyline%20Room');
    expect(roomMapSearchUrl()).toContain('nightlife%20near%20me');
  });
});

import { parseBlockRecords } from '@/safety/Safety';

describe('safety block persistence', () => {
  it('keeps valid global and venue blocks without trusting malformed storage', () => {
    const pubkey = 'a'.repeat(64);
    expect(parseBlockRecords(JSON.stringify([
      { pubkey, scope: 'global', createdAt: 1 },
      { pubkey, scope: 'venue', roomId: 'skyline', createdAt: 2 },
      { pubkey: 'bad', scope: 'global', createdAt: 3 },
      { pubkey, scope: 'venue', createdAt: 4 },
    ]))).toEqual([
      { pubkey, scope: 'global', createdAt: 1 },
      { pubkey, scope: 'venue', roomId: 'skyline', createdAt: 2 },
    ]);
  });

  it('returns an empty list for corrupt or non-array storage', () => {
    expect(parseBlockRecords('{')).toEqual([]);
    expect(parseBlockRecords('{}')).toEqual([]);
  });
});

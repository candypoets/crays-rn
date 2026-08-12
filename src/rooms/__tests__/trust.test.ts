import {
  awardIssuerValid,
  fetchRelayRootPubkey,
  fetchRelayRootPubkeyWithRetry,
  nip11UrlForRelay,
  parseNip11RootPubkey,
  revocationSignerValid,
  statusSignerValid,
  trustFromAnchor,
  type CommunityTrust,
} from '@/rooms/trust';

const ROOT = 'a'.repeat(64);
const ADMIN = 'b'.repeat(64);
const ISSUER = 'c'.repeat(64);

const trust: CommunityTrust = {
  rootPubkey: ROOT,
  admins: new Set([ROOT, ADMIN]),
  badgeIssuer: ISSUER,
};

describe('trustFromAnchor', () => {
  it('derives the admin set and badge issuer from the anchor', () => {
    expect(trustFromAnchor({
      id: 'e'.repeat(64),
      pubkey: ROOT,
      admins: [ADMIN, ROOT],
      badgeIssuer: ISSUER,
      name: 'Skyline',
      description: '',
      createdAt: 100,
    })).toEqual({ rootPubkey: ROOT, admins: new Set([ADMIN, ROOT]), badgeIssuer: ISSUER });
  });

  it('omits the badge issuer when the anchor has none', () => {
    const resolved = trustFromAnchor({
      id: 'e'.repeat(64),
      pubkey: ROOT,
      admins: [ADMIN],
      name: '',
      description: '',
      createdAt: 100,
    });
    expect(resolved.badgeIssuer).toBeUndefined();
  });
});

describe('nip11UrlForRelay', () => {
  it('maps websocket URLs to their HTTP NIP-11 endpoint', () => {
    expect(nip11UrlForRelay('ws://relay.example.com:7777')).toBe('http://relay.example.com:7777/');
    expect(nip11UrlForRelay('wss://relay.example.com/relay')).toBe('https://relay.example.com/relay');
  });

  it('rejects non-websocket relay URLs', () => {
    expect(() => nip11UrlForRelay('https://relay.example.com')).toThrow();
  });
});

describe('parseNip11RootPubkey', () => {
  it('accepts a 64-hex pubkey', () => {
    expect(parseNip11RootPubkey({ pubkey: ROOT, name: 'relay' })).toBe(ROOT);
  });

  it('rejects missing or malformed pubkeys', () => {
    expect(parseNip11RootPubkey({})).toBeUndefined();
    expect(parseNip11RootPubkey({ pubkey: 'npub1...' })).toBeUndefined();
    expect(parseNip11RootPubkey(null)).toBeUndefined();
  });
});

describe('fetchRelayRootPubkey', () => {
  it('fetches and validates the relay document', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({ pubkey: ROOT }),
    })) as unknown as typeof fetch;
    await expect(fetchRelayRootPubkey('wss://relay.example.com', fetchImpl)).resolves.toBe(ROOT);
    expect(fetchImpl).toHaveBeenCalledWith('https://relay.example.com/', {
      headers: { accept: 'application/nostr+json' },
    });
  });

  it('throws when the relay has no valid community key', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({ name: 'no key here' }),
    })) as unknown as typeof fetch;
    await expect(fetchRelayRootPubkey('wss://relay.example.com', fetchImpl)).rejects.toThrow();
  });
});

describe('fetchRelayRootPubkeyWithRetry', () => {
  it('recovers from transient NIP-11 transport failures with bounded backoff', async () => {
    const fetchImpl = jest.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ pubkey: ROOT }) }) as unknown as typeof fetch;
    const sleepImpl = jest.fn(async () => undefined);

    await expect(fetchRelayRootPubkeyWithRetry('wss://relay.example.com', {
      attempts: 3,
      delayMs: 10,
      fetchImpl,
      sleepImpl,
    })).resolves.toBe(ROOT);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleepImpl).toHaveBeenNthCalledWith(1, 10);
    expect(sleepImpl).toHaveBeenNthCalledWith(2, 20);
  });
});

describe('awardIssuerValid', () => {
  it('allows anchor admins for any definition', () => {
    expect(awardIssuerValid({ issuer: ADMIN, sellable: false, trust })).toBe(true);
    expect(awardIssuerValid({ issuer: ADMIN, sellable: true, trust })).toBe(true);
  });

  it('allows the badge issuer only for sellable definitions', () => {
    expect(awardIssuerValid({ issuer: ISSUER, sellable: true, trust })).toBe(true);
    expect(awardIssuerValid({ issuer: ISSUER, sellable: false, trust })).toBe(false);
  });

  it('rejects unrelated signers', () => {
    expect(awardIssuerValid({ issuer: 'f'.repeat(64), sellable: true, trust })).toBe(false);
  });
});

describe('statusSignerValid', () => {
  it('allows anchor admins and the badge issuer', () => {
    expect(statusSignerValid(ADMIN, trust)).toBe(true);
    expect(statusSignerValid(ISSUER, trust)).toBe(true);
    expect(statusSignerValid('f'.repeat(64), trust)).toBe(false);
  });
});

describe('revocationSignerValid', () => {
  it('allows the award issuer or an anchor admin', () => {
    expect(revocationSignerValid(ISSUER, ISSUER, trust)).toBe(true);
    expect(revocationSignerValid(ADMIN, ISSUER, trust)).toBe(true);
    expect(revocationSignerValid('f'.repeat(64), ISSUER, trust)).toBe(false);
  });
});

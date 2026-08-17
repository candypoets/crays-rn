import {
  CHECKOUT_API_URL,
  checkoutRequestBody,
  requestCheckoutUrl,
} from '@/commerce/checkout';

const mockSignActiveEvent = jest.fn();

jest.mock('@/account/account', () => ({
  signActiveEvent: (...args: unknown[]) => mockSignActiveEvent(...args),
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { HEX: 'hex' },
  digestStringAsync: jest.fn(async () => 'a'.repeat(64)),
}));

const signedAuthorizationEvent = {
  id: 'c'.repeat(64),
  pubkey: 'b'.repeat(64),
  created_at: 1_700_000_000,
  kind: 27235,
  tags: [['u', CHECKOUT_API_URL], ['method', 'POST'], ['payload', 'a'.repeat(64)]],
  content: '',
  sig: 'd'.repeat(128),
};

describe('Stripe checkout contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignActiveEvent.mockResolvedValue(signedAuthorizationEvent);
  });

  it('builds the exact shared payment-service request body', () => {
    expect(checkoutRequestBody({
      community: 'wss://crays-test.relays.nuts.cash',
      eventAddress: `30402:${'e'.repeat(64)}:mezcal-negroni`,
    })).toBe(JSON.stringify({
      community: 'wss://crays-test.relays.nuts.cash',
      eventAddress: `30402:${'e'.repeat(64)}:mezcal-negroni`,
      returnTo: '/explore',
    }));
  });

  it('posts NIP-98 authorization and returns the hosted URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.test/session' }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(requestCheckoutUrl({
      community: 'wss://crays-test.relays.nuts.cash',
      eventAddress: `30402:${'e'.repeat(64)}:mezcal-negroni`,
    })).resolves.toBe('https://checkout.stripe.test/session');

    expect(fetchMock).toHaveBeenCalledWith(CHECKOUT_API_URL, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'content-type': 'application/json',
        authorization: expect.stringMatching(/^Nostr /),
      }),
    }));
    expect(mockSignActiveEvent).toHaveBeenCalledWith(expect.objectContaining({
      kind: 27235,
      tags: expect.arrayContaining([
        ['u', CHECKOUT_API_URL],
        ['method', 'POST'],
        ['payload', 'a'.repeat(64)],
      ]),
    }));
  });

  it('surfaces payment-service failures without claiming an order', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'this community has not connected Stripe' }),
    });

    await expect(requestCheckoutUrl({
      community: 'wss://crays-test.relays.nuts.cash',
      eventAddress: `30402:${'e'.repeat(64)}:mezcal-negroni`,
    })).rejects.toThrow('this community has not connected Stripe');
  });
});

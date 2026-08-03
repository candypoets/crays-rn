import * as SecureStore from 'expo-secure-store';
import { decodeInviteToken, loadInvitePreview, redeemInvite } from '@/invites/invites';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

const issuer = 'a'.repeat(64);
const claims = { v: 1, nonce: 'qa-nonce', badge: `30009:${issuer}:members`, exp: 2_000_000_000, badge_exp: 2_000_100_000, max: 1 };
const base64url = (value: object) => globalThis.btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = `${base64url(claims)}.server-signature`;

describe('invite contract', () => {
  beforeEach(() => { jest.resetAllMocks(); (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null); });

  it('decodes supported unexpired claims without claiming to verify the HMAC', () => {
    expect(decodeInviteToken(token, 1_900_000_000)).toEqual(claims);
  });

  it.each([
    ['missing signature', token.split('.')[0]],
    ['expired', `${base64url({ ...claims, exp: 1 })}.sig`],
    ['wrong badge', `${base64url({ ...claims, badge: 'bad' })}.sig`],
  ])('rejects %s tokens', (_label, input) => expect(() => decodeInviteToken(input, 10)).toThrow());

  it('matches token, required badge, and issuer metadata', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ badge_issuer: issuer, relay_url: 'wss://venue.test', required_badge: claims.badge }) }) as never;
    await expect(loadInvitePreview('https://venue.test', token)).resolves.toMatchObject({ claims, serviceUrl: 'https://venue.test' });
  });

  it('posts one redemption and reuses the persisted result', async () => {
    globalThis.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ badge_issuer: issuer, relay_url: 'wss://venue.test', required_badge: claims.badge }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_id: 'b'.repeat(64) }) }) as never;
    const preview = await loadInvitePreview('https://venue.test', token);
    await expect(redeemInvite(preview, token, 'c'.repeat(64))).resolves.toMatchObject({ eventId: 'b'.repeat(64), nonce: 'qa-nonce' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });
});

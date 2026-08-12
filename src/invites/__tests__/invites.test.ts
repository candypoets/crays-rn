import type { ParsedEvent } from '@candypoets/nipworker';
import * as SecureStore from 'expo-secure-store';
import { decodeInviteToken, fetchInviteHandoff, inviteAwardMatches, loadInvitePreview, redeemInvite, resolveInviteSource } from '@/invites/invites';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

const root = 'a'.repeat(64);
const admin = 'd'.repeat(64);
const badgeIssuer = 'e'.repeat(64);
const claims = { v: 1, nonce: 'qa-nonce', badge: `30009:${root}:members`, exp: 2_000_000_000, badge_exp: 2_000_100_000, max: 1 };
const communityInfo = {
  community_root: root,
  admins: [root, admin],
  badge_issuer: badgeIssuer,
  relay_url: 'wss://venue.test',
  required_badge: claims.badge,
};
const base64url = (value: object) => globalThis.btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = `${base64url(claims)}.server-signature`;

function awardEvent(tags: string[][], overrides: { id?: string; issuer?: string } = {}): ParsedEvent {
  return {
    kind: () => 8,
    id: () => overrides.id || 'b'.repeat(64),
    pubkey: () => overrides.issuer || badgeIssuer,
    createdAt: () => 100,
    tags: (index: number) => tags[index] || null,
    tagsLength: () => tags.length,
  } as unknown as ParsedEvent;
}

describe('invite contract', () => {
  beforeEach(() => { jest.resetAllMocks(); (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null); });

  it('decodes supported unexpired claims without claiming to verify the HMAC', () => {
    expect(decodeInviteToken(token, 1_900_000_000)).toEqual(claims);
  });

  it('treats the exact expiration second as expired', () => {
    expect(() => decodeInviteToken(token, claims.exp)).toThrow(/expired/i);
  });

  it('passes forged claims client-side because the HMAC key is server-only; only /redeem rejects them', () => {
    // Documents the trust boundary: the issuer signs with HMAC-SHA256 keyed by
    // a server-only INVITE_SECRET (strfry-badge-node/crates/invite), so no
    // client-side check can detect tampering. Preview copy must never call the
    // invite "verified" before redemption succeeds.
    const forged = `${base64url({ ...claims, max: 100 })}.forged-signature`;
    expect(decodeInviteToken(forged, 1_900_000_000)).toMatchObject({ nonce: 'qa-nonce', max: 100 });
  });

  it.each([
    ['missing signature', token.split('.')[0]],
    ['expired', `${base64url({ ...claims, exp: 1 })}.sig`],
    ['wrong badge', `${base64url({ ...claims, badge: 'bad' })}.sig`],
  ])('rejects %s tokens', (_label, input) => expect(() => decodeInviteToken(input, 10)).toThrow());

  it('matches token, required badge, and anchor metadata', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => communityInfo }) as never;
    await expect(loadInvitePreview('https://venue.test', token)).resolves.toMatchObject({ claims, serviceUrl: 'https://venue.test' });
  });

  it('rejects a membership definition authored outside the anchor admins', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...communityInfo, required_badge: `30009:${'0'.repeat(64)}:members` }),
    }) as never;
    const foreignToken = `${base64url({ ...claims, badge: `30009:${'0'.repeat(64)}:members` })}.server-signature`;
    await expect(loadInvitePreview('https://venue.test', foreignToken)).rejects.toThrow(/published identity/);
  });

  it('loads a hidden room-entry handoff without exposing the token in navigation', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ service_url: 'https://venue.test', token }) }) as never;
    await expect(fetchInviteHandoff('https://nearby.test/invite')).resolves.toEqual({ serviceUrl: 'https://venue.test', token });
  });

  it('uses a direct broadcast invite without fetching a handoff proxy', async () => {
    globalThis.fetch = jest.fn() as never;
    await expect(resolveInviteSource({ serviceUrl: 'https://venue.test', token })).resolves.toEqual({ serviceUrl: 'https://venue.test', token });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('requires both halves of a direct broadcast invite', async () => {
    await expect(resolveInviteSource({ token })).rejects.toThrow(/incomplete/i);
  });

  it('rejects an incomplete room-entry handoff', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ service_url: 'https://venue.test' }) }) as never;
    await expect(fetchInviteHandoff('https://nearby.test/invite')).rejects.toThrow(/grant tonight/i);
  });

  it('posts one redemption and reuses the persisted result', async () => {
    globalThis.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => communityInfo })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_id: 'b'.repeat(64) }) }) as never;
    const preview = await loadInvitePreview('https://venue.test', token);
    await expect(redeemInvite(preview, token, 'c'.repeat(64))).resolves.toMatchObject({ eventId: 'b'.repeat(64), nonce: 'qa-nonce' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });

  it('matches only the exact live membership award returned by redemption', () => {
    const event = awardEvent([
      ['a', claims.badge],
      ['p', 'c'.repeat(64)],
      ['i', `invite-redemption:${claims.nonce}`],
      ['t', '30009'],
      ['t', 'membership'],
      ['expiration', '2000000100'],
    ]);
    const expected = {
      event,
      eventId: 'b'.repeat(64),
      issuerPubkey: badgeIssuer,
      badgeAddress: claims.badge,
      nonce: claims.nonce,
      pubkey: 'c'.repeat(64),
      now: 2_000_000_000,
    };

    expect(inviteAwardMatches(expected)).toBe(true);
    expect(inviteAwardMatches({ ...expected, nonce: 'another-invite' })).toBe(false);
    expect(inviteAwardMatches({ ...expected, pubkey: 'f'.repeat(64) })).toBe(false);
    expect(inviteAwardMatches({ ...expected, now: 2_000_000_100 })).toBe(false);
    expect(inviteAwardMatches({ ...expected, event: awardEvent([
      ['a', claims.badge],
      ['p', 'c'.repeat(64)],
      ['i', `invite-redemption:${claims.nonce}`],
      ['t', 'membership'],
      ['expiration', 'not-a-time'],
    ]) })).toBe(false);
  });
});

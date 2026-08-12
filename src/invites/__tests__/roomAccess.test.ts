import { grantVisibleRoomAccess, inviteSourceForVisibility } from '@/invites/roomAccess';

const root = 'a'.repeat(64);
const pubkey = 'b'.repeat(64);
const preview = {
  claims: { v: 1 as const, nonce: 'nearby-test', badge: `30009:${root}:members`, exp: 2_000_000_000, max: Number.MAX_SAFE_INTEGER },
  community: {
    community_root: root,
    admins: [root],
    badge_issuer: 'c'.repeat(64),
    relay_url: 'wss://venue.test',
    required_badge: `30009:${root}:members`,
  },
  serviceUrl: 'https://venue.test',
};

describe('nearby room access ordering', () => {
  it('removes the invite entirely from quiet entry', () => {
    const source = { serviceUrl: 'https://venue.test', token: 'claims.signature' };
    expect(inviteSourceForVisibility('quiet', source)).toBeNull();
    expect(inviteSourceForVisibility('visible', source)).toEqual(source);
    expect(inviteSourceForVisibility('visible', {})).toBeNull();
  });

  it('confirms the exact award after redemption and before returning access', async () => {
    const calls: string[] = [];
    const redemption = { eventId: 'd'.repeat(64), nonce: 'nearby-test', pubkey, redeemedAt: 1 };
    const operations = {
      resolve: jest.fn(async () => { calls.push('resolve'); return { serviceUrl: 'https://venue.test', token: 'claims.signature' }; }),
      preview: jest.fn(async () => { calls.push('preview'); return preview; }),
      redeem: jest.fn(async () => { calls.push('redeem'); return redemption; }),
      confirm: jest.fn(async () => { calls.push('confirm'); }),
    };

    await expect(grantVisibleRoomAccess({
      source: { serviceUrl: 'https://venue.test', token: 'claims.signature' },
      pubkey,
      roomRelayUrl: 'wss://venue.test',
      operations,
    })).resolves.toEqual(redemption);
    expect(calls).toEqual(['resolve', 'preview', 'redeem', 'confirm']);
  });

  it('stops before redemption when the invite points at another room', async () => {
    const redeem = jest.fn();
    await expect(grantVisibleRoomAccess({
      source: { serviceUrl: 'https://venue.test', token: 'claims.signature' },
      pubkey,
      roomRelayUrl: 'wss://another-room.test',
      operations: {
        resolve: jest.fn(async () => ({ serviceUrl: 'https://venue.test', token: 'claims.signature' })),
        preview: jest.fn(async () => preview),
        redeem,
        confirm: jest.fn(),
      },
    })).rejects.toThrow(/another venue/i);
    expect(redeem).not.toHaveBeenCalled();
  });
});

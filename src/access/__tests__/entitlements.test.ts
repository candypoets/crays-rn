import { deriveEntitlements, entitlementState, presentationContextFor } from '@/access/entitlements';
import type { CommunityTrust } from '@/rooms/trust';

const ADMIN = 'b'.repeat(64);
const ISSUER = 'c'.repeat(64);
const trust: CommunityTrust = { rootPubkey: 'f'.repeat(64), admins: new Set([ADMIN]), badgeIssuer: ISSUER };

const award = {
  id: 'a'.repeat(64), address: `30402:${ADMIN}:five-visits`,
  issuerPubkey: ISSUER, recipientPubkey: 'd'.repeat(64), orderRef: 'award-1', createdAt: 10,
};
const definition = {
  id: 'e'.repeat(64), address: award.address, issuerPubkey: ADMIN, type: 'pass' as const,
  name: 'Five visits', description: 'Five door entries', maxUses: 2, sellable: true,
};
const room = { id: 'skyline', name: 'Skyline', relayUrl: 'wss://relay.example' };

function derive(overrides: Partial<Parameters<typeof deriveEntitlements>[0]> = {}) {
  return deriveEntitlements({
    awards: [award],
    definitions: new Map([[definition.address, definition]]),
    statuses: [],
    revocations: new Map(),
    trust,
    room,
    ...overrides,
  });
}

describe('durable entitlement projection', () => {
  it('counts only the latest fulfilled status per context', () => {
    const statuses = [
      { id: '2', awardId: award.id, address: award.address, recipientPubkey: award.recipientPubkey, signerPubkey: ADMIN, contextKey: 'order:one', status: 'fulfilled' as const, createdAt: 20 },
      { id: '1', awardId: award.id, address: award.address, recipientPubkey: award.recipientPubkey, signerPubkey: ADMIN, contextKey: 'order:one', status: 'cancelled' as const, createdAt: 21 },
      { id: '3', awardId: award.id, address: award.address, recipientPubkey: award.recipientPubkey, signerPubkey: ADMIN, contextKey: 'order:two', status: 'fulfilled' as const, createdAt: 22 },
      { id: '4', awardId: award.id, address: award.address, recipientPubkey: award.recipientPubkey, signerPubkey: '0'.repeat(64), contextKey: 'order:three', status: 'fulfilled' as const, createdAt: 23 },
    ];
    const [item] = derive({ statuses, now: 30 });
    expect(item.remainingUses).toBe(1);
    expect(item.state).toBe('available');
    // The untrusted signer's status is ignored, so only two activities count.
    expect(item.activity).toHaveLength(2);
  });

  it('gives revocation and expiry precedence and exhausts finite passes', () => {
    expect(entitlementState({ type: 'pass', revoked: true, expiresAt: 1, remainingUses: 0, activity: [], now: 2 })).toBe('revoked');
    expect(entitlementState({ type: 'pass', revoked: false, expiresAt: 1, remainingUses: 0, activity: [], now: 2 })).toBe('expired');
    expect(entitlementState({ type: 'pass', revoked: false, remainingUses: 0, activity: [], now: 2 })).toBe('exhausted');
  });

  it('uses fresh contexts for reusable awards', () => {
    const [item] = derive();
    expect(presentationContextFor(item, 'fresh')).toEqual({ orderId: 'use:fresh' });
  });

  it('drops awards from untrusted issuers', () => {
    const stranger = { ...award, issuerPubkey: '0'.repeat(64) };
    expect(derive({ awards: [stranger] })).toHaveLength(0);
  });

  it('lets anchor admins award any definition but the badge issuer only sellable ones', () => {
    const adminAward = { ...award, issuerPubkey: ADMIN };
    expect(derive({ awards: [adminAward] })).toHaveLength(1);
    const unpriced = { ...definition, sellable: false };
    expect(derive({
      definitions: new Map([[unpriced.address, unpriced]]),
    })).toHaveLength(0);
    expect(derive({
      awards: [adminAward],
      definitions: new Map([[unpriced.address, unpriced]]),
    })).toHaveLength(1);
  });

  it('honors revocations from the award issuer or an anchor admin only', () => {
    const byIssuer = derive({ revocations: new Map([[award.id, ISSUER]]) });
    expect(byIssuer[0]?.state).toBe('revoked');
    const byAdmin = derive({ revocations: new Map([[award.id, ADMIN]]) });
    expect(byAdmin[0]?.state).toBe('revoked');
    const byStranger = derive({ revocations: new Map([[award.id, '0'.repeat(64)]]) });
    expect(byStranger[0]?.state).not.toBe('revoked');
  });
});

import { deriveEntitlements, entitlementState, presentationContextFor } from '@/access/entitlements';

const award = {
  id: 'a'.repeat(64), address: `30009:${'b'.repeat(64)}:five-visits`,
  issuerPubkey: 'c'.repeat(64), recipientPubkey: 'd'.repeat(64), orderRef: 'award-1', createdAt: 10,
};
const definition = {
  id: 'e'.repeat(64), address: award.address, issuerPubkey: 'b'.repeat(64), type: 'pass' as const,
  name: 'Five visits', description: 'Five door entries', maxUses: 2,
};
const room = { id: 'skyline', name: 'Skyline', relayUrl: 'wss://relay.example' };

describe('durable entitlement projection', () => {
  it('counts only the latest fulfilled status per context', () => {
    const statuses = [
      { id: '2', awardId: award.id, address: award.address, recipientPubkey: award.recipientPubkey, contextKey: 'order:one', status: 'fulfilled' as const, createdAt: 20 },
      { id: '1', awardId: award.id, address: award.address, recipientPubkey: award.recipientPubkey, contextKey: 'order:one', status: 'cancelled' as const, createdAt: 21 },
      { id: '3', awardId: award.id, address: award.address, recipientPubkey: award.recipientPubkey, contextKey: 'order:two', status: 'fulfilled' as const, createdAt: 22 },
    ];
    const [item] = deriveEntitlements({ awards: [award], definitions: new Map([[definition.address, definition]]), statuses, revokedAwardIds: new Set(), room, now: 30 });
    expect(item.remainingUses).toBe(1);
    expect(item.state).toBe('available');
    expect(item.activity).toHaveLength(2);
  });

  it('gives revocation and expiry precedence and exhausts finite passes', () => {
    expect(entitlementState({ type: 'pass', revoked: true, expiresAt: 1, remainingUses: 0, activity: [], now: 2 })).toBe('revoked');
    expect(entitlementState({ type: 'pass', revoked: false, expiresAt: 1, remainingUses: 0, activity: [], now: 2 })).toBe('expired');
    expect(entitlementState({ type: 'pass', revoked: false, remainingUses: 0, activity: [], now: 2 })).toBe('exhausted');
  });

  it('uses fresh contexts for reusable awards', () => {
    const [item] = deriveEntitlements({ awards: [award], definitions: new Map([[definition.address, definition]]), statuses: [], revokedAwardIds: new Set(), room });
    expect(presentationContextFor(item, 'fresh')).toEqual({ orderId: 'use:fresh' });
  });
});

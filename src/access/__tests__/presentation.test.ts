import { encodePresentation, entitlementPresentationTemplate, PRESENTATION_KIND, PRESENTATION_PREFIX } from '@/access/presentation';

jest.mock('@/account/account', () => ({ signActiveEvent: jest.fn() }));

describe('entitlement presentation', () => {
  it('builds and encodes the scanner contract', () => {
    const template = entitlementPresentationTemplate({
      awardId: 'a'.repeat(64), badgeAddress: `30009:${'b'.repeat(64)}:membership`,
      community: 'wss://relay.example', nonce: 'nonce', orderId: 'use:one', createdAt: 100,
    });
    const event = { ...template, id: 'c'.repeat(64), pubkey: 'd'.repeat(64), sig: 'e'.repeat(128) };
    const payload = encodePresentation(event);
    expect(event.kind).toBe(PRESENTATION_KIND);
    expect(event.tags).toContainEqual(['expiration', '190']);
    expect(event.tags).toContainEqual(['order', 'use:one']);
    expect(payload.startsWith(PRESENTATION_PREFIX)).toBe(true);
    expect(payload).not.toContain('=');
    expect(event.pubkey).toHaveLength(64);
  });

  it('requires one fulfillment context', () => {
    expect(() => entitlementPresentationTemplate({ awardId: 'a'.repeat(64), badgeAddress: `30009:${'b'.repeat(64)}:x`, community: 'wss://relay.example', nonce: 'n' })).toThrow('Exactly one');
  });

  it('accepts every NIP-97 definition family as the badge address', () => {
    for (const badgeAddress of [
      `30009:${'b'.repeat(64)}:members`,
      `30402:${'b'.repeat(64)}:espresso`,
      `31923:${'b'.repeat(64)}:friday-jazz`,
    ]) {
      expect(() => entitlementPresentationTemplate({
        awardId: 'a'.repeat(64), badgeAddress, community: 'wss://relay.example', nonce: 'n', orderId: 'use:one',
      })).not.toThrow();
    }
    expect(() => entitlementPresentationTemplate({
      awardId: 'a'.repeat(64), badgeAddress: `31925:${'b'.repeat(64)}:rsvp`, community: 'wss://relay.example', nonce: 'n', orderId: 'use:one',
    })).toThrow('Entitlement address is invalid.');
  });
});

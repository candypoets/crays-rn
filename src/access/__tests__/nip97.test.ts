import type { ParsedEvent } from '@candypoets/nipworker';

import {
  ANCHOR_KIND,
  definitionAddress,
  isDefinitionAddress,
  isNamedCapability,
  isNewerAnchor,
  isSellableDefinition,
  maxUsesForDefinition,
  parseCommunityAnchor,
  parsePermissionTag,
  parsePermissionTags,
  parsePriceTag,
  permissionGrants,
  permissionKind,
} from '@/access/nip97';

const ROOT = 'a'.repeat(64);
const ADMIN = 'b'.repeat(64);
const ISSUER = 'c'.repeat(64);

function fakeEvent({
  kind,
  pubkey,
  id = 'e'.repeat(64),
  createdAt = 100,
  tags = [],
}: {
  kind: number;
  pubkey: string;
  id?: string;
  createdAt?: number;
  tags?: string[][];
}): ParsedEvent {
  return {
    kind: () => kind,
    pubkey: () => pubkey,
    id: () => id,
    createdAt: () => createdAt,
    tags: (index: number) => tags[index] ?? null,
    tagsLength: () => tags.length,
  } as unknown as ParsedEvent;
}

function anchorEvent(tags: string[][], overrides: Partial<Parameters<typeof fakeEvent>[0]> = {}) {
  return fakeEvent({ kind: ANCHOR_KIND, pubkey: ROOT, tags, ...overrides });
}

describe('parseCommunityAnchor', () => {
  const baseTags = [
    ['d', 'community'],
    ['p', ADMIN],
    ['badge_issuer', ISSUER],
    ['name', 'Skyline'],
    ['description', 'Rooftop jazz'],
    ['image', 'https://example.com/skyline.png'],
  ];

  it('parses a full anchor', () => {
    const anchor = parseCommunityAnchor(anchorEvent(baseTags));
    expect(anchor).toEqual({
      id: 'e'.repeat(64),
      pubkey: ROOT,
      admins: [ADMIN],
      badgeIssuer: ISSUER,
      name: 'Skyline',
      description: 'Rooftop jazz',
      image: 'https://example.com/skyline.png',
      createdAt: 100,
    });
  });

  it('requires the community d tag', () => {
    expect(parseCommunityAnchor(anchorEvent([['d', 'other'], ['p', ADMIN]]))).toBeUndefined();
    expect(parseCommunityAnchor(anchorEvent([['p', ADMIN]]))).toBeUndefined();
  });

  it('requires the anchor kind', () => {
    expect(parseCommunityAnchor(fakeEvent({ kind: 30009, pubkey: ROOT, tags: baseTags }))).toBeUndefined();
  });

  it('requires at least one admin', () => {
    expect(parseCommunityAnchor(anchorEvent([['d', 'community']]))).toBeUndefined();
  });

  it('ignores a malformed badge issuer', () => {
    const anchor = parseCommunityAnchor(anchorEvent([['d', 'community'], ['p', ADMIN], ['badge_issuer', 'nope']]));
    expect(anchor?.badgeIssuer).toBeUndefined();
  });
});

describe('isNewerAnchor', () => {
  const current = parseCommunityAnchor(anchorEvent([['d', 'community'], ['p', ADMIN]], { createdAt: 200, id: 'f'.repeat(64) }))!;

  it('prefers the later created_at', () => {
    const newer = parseCommunityAnchor(anchorEvent([['d', 'community'], ['p', ADMIN]], { createdAt: 201 }))!;
    const older = parseCommunityAnchor(anchorEvent([['d', 'community'], ['p', ADMIN]], { createdAt: 199 }))!;
    expect(isNewerAnchor(newer, current)).toBe(true);
    expect(isNewerAnchor(older, current)).toBe(false);
  });

  it('breaks created_at ties with the lowest event id', () => {
    const lower = parseCommunityAnchor(anchorEvent([['d', 'community'], ['p', ADMIN]], { createdAt: 200, id: '0'.repeat(64) }))!;
    expect(isNewerAnchor(lower, current)).toBe(true);
    expect(isNewerAnchor(current, lower)).toBe(false);
  });
});

describe('permission tags', () => {
  it('round-trips the full grammar', () => {
    expect(parsePermissionTag(['permission', '37237', 'write', 'membership'])).toEqual({
      capability: '37237',
      access: 'write',
      topic: 'membership',
    });
    expect(parsePermissionTag(['permission', '1'])).toEqual({ capability: '1', access: undefined, topic: undefined });
    expect(parsePermissionTag(['permission', '30009', '', 'membership'])).toEqual({
      capability: '30009',
      access: undefined,
      topic: 'membership',
    });
    expect(parsePermissionTag(['permission', 'invites'])).toEqual({
      capability: 'invites',
      access: undefined,
      topic: undefined,
    });
  });

  it('rejects non-permission and capability-less tags', () => {
    expect(parsePermissionTag(['t', 'role'])).toBeUndefined();
    expect(parsePermissionTag(['permission'])).toBeUndefined();
  });

  it('collects permission tags from an event-shaped source', () => {
    const event = fakeEvent({
      kind: 30009,
      pubkey: ADMIN,
      tags: [['permission', '1', 'write'], ['permission', '37237'], ['t', 'role']],
    });
    expect(parsePermissionTags(event)).toEqual([
      { capability: '1', access: 'write', topic: undefined },
      { capability: '37237', access: undefined, topic: undefined },
    ]);
  });

  it('classifies kind numbers and named capabilities', () => {
    expect(permissionKind({ capability: '31923' })).toBe(31923);
    expect(permissionKind({ capability: '65536' })).toBeUndefined();
    expect(isNamedCapability({ capability: 'invites' })).toBe(true);
    expect(isNamedCapability({ capability: '1' })).toBe(false);
  });
});

describe('permissionGrants', () => {
  it('matches kind, access, and topic', () => {
    expect(permissionGrants({ capability: '1', access: 'write' }, 1, 'write')).toBe(true);
    expect(permissionGrants({ capability: '1', access: 'write' }, 1, 'read')).toBe(false);
    expect(permissionGrants({ capability: '1' }, 1, 'read')).toBe(true);
    expect(permissionGrants({ capability: '1' }, 1, 'write')).toBe(true);
    expect(permissionGrants({ capability: '1' }, 4, 'write')).toBe(false);
  });

  it('applies the topic filter only when set', () => {
    const topicPermission = { capability: '30009', access: 'write' as const, topic: 'membership' };
    expect(permissionGrants(topicPermission, 30009, 'write', 'membership')).toBe(true);
    expect(permissionGrants(topicPermission, 30009, 'write', 'role')).toBe(false);
    expect(permissionGrants({ capability: '30009', access: 'write' }, 30009, 'write', 'role')).toBe(true);
  });

  it('never grants a kind through a named capability', () => {
    expect(permissionGrants({ capability: 'invites' }, 1, 'write')).toBe(false);
  });
});

describe('definition addresses', () => {
  it('builds and recognizes definition addresses', () => {
    expect(definitionAddress(30402, ROOT, 'espresso')).toBe(`30402:${ROOT}:espresso`);
    expect(isDefinitionAddress(`30009:${ROOT}:members`)).toBe(true);
    expect(isDefinitionAddress(`30402:${ROOT}:espresso`)).toBe(true);
    expect(isDefinitionAddress(`31923:${ROOT}:friday-jazz`)).toBe(true);
    expect(isDefinitionAddress(`31925:${ROOT}:rsvp`)).toBe(false);
    expect(isDefinitionAddress('not-an-address')).toBe(false);
  });
});

describe('price tags', () => {
  it('parses amount, currency, and recurrence', () => {
    expect(parsePriceTag([['price', '24.00', 'EUR', 'month']])).toEqual({ amount: 24, currency: 'EUR', recurrence: 'month' });
    expect(parsePriceTag([['price', '0', 'SAT']])).toEqual({ amount: 0, currency: 'SAT' });
  });

  it('rejects malformed price tags', () => {
    expect(parsePriceTag([['price', 'twenty', 'EUR']])).toBeUndefined();
    expect(parsePriceTag([['price', '24.00', 'eur']])).toBeUndefined();
    expect(parsePriceTag([['price', '-5', 'EUR']])).toBeUndefined();
    expect(parsePriceTag([['name', 'Espresso']])).toBeUndefined();
  });

  it('treats zero price as sellable (gate semantics)', () => {
    expect(isSellableDefinition([['price', '0', 'SAT']])).toBe(true);
    expect(isSellableDefinition([['price', '24.00', 'EUR']])).toBe(true);
    expect(isSellableDefinition([['name', 'Espresso']])).toBe(false);
  });
});

describe('maxUsesForDefinition', () => {
  it('honors an explicit positive max_uses', () => {
    expect(maxUsesForDefinition(30402, [['max_uses', '10']])).toBe(10);
    expect(maxUsesForDefinition(30009, [['max_uses', '3']])).toBe(3);
  });

  it('defaults 30402 listings to one use and other kinds to unlimited', () => {
    expect(maxUsesForDefinition(30402, [])).toBe(1);
    expect(maxUsesForDefinition(30009, [])).toBeUndefined();
    expect(maxUsesForDefinition(31923, [])).toBeUndefined();
  });

  it('ignores invalid max_uses values', () => {
    expect(maxUsesForDefinition(30402, [['max_uses', '0']])).toBe(1);
    expect(maxUsesForDefinition(30009, [['max_uses', 'many']])).toBeUndefined();
  });
});

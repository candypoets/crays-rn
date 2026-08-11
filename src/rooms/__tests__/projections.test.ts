import type { ParsedEvent } from '@candypoets/nipworker';

import {
  projectCalendarEvent,
  projectEntitlementDefinition,
  projectMembershipOffer,
  projectRoomProduct,
} from '@/rooms/projections';

const ADMIN = 'b'.repeat(64);
const OTHER = '0'.repeat(64);
const ADMINS = new Set([ADMIN]);

function fakeEvent({
  kind,
  pubkey = ADMIN,
  id = 'e'.repeat(64),
  createdAt = 100,
  tags = [],
}: {
  kind: number;
  pubkey?: string;
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

describe('projectRoomProduct', () => {
  const listing = [
    ['d', 'espresso'], ['title', 'Espresso'], ['summary', 'Double shot'],
    ['price', '3.50', 'EUR'], ['section', 'Bar'], ['product_kind', 'item'],
    ['availability', 'available'], ['position', '1'],
  ];

  it('projects a 30402 listing with its NIP-99 fields', () => {
    expect(projectRoomProduct(fakeEvent({ kind: 30402, tags: listing }), ADMINS)).toEqual({
      id: 'e'.repeat(64),
      address: `30402:${ADMIN}:espresso`,
      name: 'Espresso',
      description: 'Double shot',
      price: 3.5,
      currency: 'EUR',
      section: 'Bar',
      productKind: 'item',
      available: true,
      position: 1,
    });
  });

  it('rejects tickets, multi-use passes, non-admin authors, and legacy 30009 products', () => {
    const ticket = fakeEvent({ kind: 30402, tags: [...listing, ['a', `31923:${ADMIN}:jazz`]] });
    const pass = fakeEvent({ kind: 30402, tags: [...listing, ['max_uses', '3']] });
    expect(projectRoomProduct(ticket, ADMINS)).toBeNull();
    expect(projectRoomProduct(pass, ADMINS)).toBeNull();
    expect(projectRoomProduct(fakeEvent({ kind: 30402, pubkey: OTHER, tags: listing }), ADMINS)).toBeNull();
    const legacy = fakeEvent({ kind: 30009, tags: [['d', 'x'], ['type', 'product'], ['name', 'Old'], ['price', '1', 'EUR']] });
    expect(projectRoomProduct(legacy, ADMINS)).toBeNull();
  });
});

describe('projectMembershipOffer', () => {
  it('projects a 30009 t=membership definition with billing from the price recurrence', () => {
    const membership = fakeEvent({
      kind: 30009,
      tags: [
        ['d', 'skyline-regular'], ['t', 'membership'], ['name', 'Skyline regular'],
        ['description', 'Member nights'], ['price', '24.00', 'EUR', 'month'],
      ],
    });
    expect(projectMembershipOffer(membership, ADMINS)).toEqual({
      id: 'e'.repeat(64),
      address: `30009:${ADMIN}:skyline-regular`,
      name: 'Skyline regular',
      description: 'Member nights',
      price: 24,
      currency: 'EUR',
      billing: 'monthly',
      available: true,
    });
  });

  it('requires the membership topic and a price', () => {
    const role = fakeEvent({ kind: 30009, tags: [['d', 'staff'], ['t', 'role'], ['name', 'Staff'], ['price', '1', 'EUR']] });
    expect(projectMembershipOffer(role, ADMINS)).toBeNull();
    const free = fakeEvent({ kind: 30009, tags: [['d', 'club'], ['t', 'membership'], ['name', 'Club']] });
    expect(projectMembershipOffer(free, ADMINS)).toBeNull();
  });
});

describe('projectEntitlementDefinition', () => {
  it('classifies memberships as unlimited-use sellable definitions', () => {
    const membership = fakeEvent({
      kind: 30009,
      tags: [['d', 'members'], ['t', 'membership'], ['name', 'Member'], ['price', '0', 'SAT'], ['permission', '1', 'write']],
    });
    expect(projectEntitlementDefinition(membership, ADMINS)).toEqual({
      id: 'e'.repeat(64),
      address: `30009:${ADMIN}:members`,
      issuerPubkey: ADMIN,
      type: 'membership',
      name: 'Member',
      description: '',
      billing: 'one-time',
      eventAddress: undefined,
      maxUses: undefined,
      sellable: true,
    });
  });

  it('classifies 30402 listings into product, pass, and ticket', () => {
    const product = fakeEvent({ kind: 30402, tags: [['d', 'espresso'], ['title', 'Espresso'], ['price', '3.5', 'EUR']] });
    expect(projectEntitlementDefinition(product, ADMINS)).toMatchObject({ type: 'product', maxUses: 1, sellable: true });

    const pass = fakeEvent({ kind: 30402, tags: [['d', 'ten-visits'], ['title', 'Ten visits'], ['price', '30', 'EUR'], ['max_uses', '10']] });
    expect(projectEntitlementDefinition(pass, ADMINS)).toMatchObject({ type: 'pass', maxUses: 10 });

    const ticket = fakeEvent({ kind: 30402, tags: [['d', 'jazz-ticket'], ['title', 'Jazz entry'], ['price', '25', 'EUR'], ['a', `31923:${ADMIN}:jazz`]] });
    expect(projectEntitlementDefinition(ticket, ADMINS)).toMatchObject({
      type: 'event_access',
      eventAddress: `31923:${ADMIN}:jazz`,
      maxUses: 1,
    });
  });

  it('treats a calendar event as its own free-admission definition', () => {
    const jazz = fakeEvent({ kind: 31923, tags: [['d', 'jazz'], ['title', 'Rooftop Jazz'], ['start', '200']] });
    expect(projectEntitlementDefinition(jazz, ADMINS)).toMatchObject({
      type: 'event_access',
      address: `31923:${ADMIN}:jazz`,
      eventAddress: `31923:${ADMIN}:jazz`,
      name: 'Rooftop Jazz',
      maxUses: undefined,
      sellable: false,
    });
  });

  it('rejects non-admin authors and non-definition events', () => {
    const product = fakeEvent({ kind: 30402, pubkey: OTHER, tags: [['d', 'x'], ['title', 'X'], ['price', '1', 'EUR']] });
    expect(projectEntitlementDefinition(product, ADMINS)).toBeNull();
    const post = fakeEvent({ kind: 1, tags: [['h', 'skyline']] });
    expect(projectEntitlementDefinition(post, ADMINS)).toBeNull();
  });
});

describe('projectCalendarEvent', () => {
  it('requires an anchor-admin author', () => {
    const jazz = fakeEvent({
      kind: 31923,
      tags: [['d', 'jazz'], ['title', 'Rooftop Jazz'], ['start', '200'], ['price', '0.00', 'EUR']],
    });
    expect(projectCalendarEvent(jazz, ADMINS)?.address).toBe(`31923:${ADMIN}:jazz`);
    expect(projectCalendarEvent(fakeEvent({ kind: 31923, pubkey: OTHER, tags: [['d', 'j'], ['title', 'J'], ['start', '1']] }), ADMINS)).toBeNull();
  });
});

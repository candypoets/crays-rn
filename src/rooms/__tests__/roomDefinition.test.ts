import type { ParsedEvent } from '@candypoets/nipworker';

import { isNewerRoomDefinition, projectRoomDefinition } from '@/rooms/roomDefinition';
import type { CommunityTrust } from '@/rooms/trust';

const ROOT = 'a'.repeat(64);
const ADMIN = 'b'.repeat(64);
const OTHER = 'c'.repeat(64);
const RELAY = 'wss://room.example';
const trust: CommunityTrust = { rootPubkey: ROOT, admins: new Set([ADMIN]) };

function fakeEvent({
  kind = 30312,
  pubkey = ADMIN,
  id = 'e'.repeat(64),
  createdAt = 100,
  tags = [
    ['d', 'skyline'],
    ['room', 'The Skyline Room'],
    ['summary', 'Rooftop jazz.'],
    ['status', 'open'],
    ['service', 'https://room.example/skyline'],
    ['p', ADMIN, RELAY, 'Host'],
    ['relays', RELAY],
    ['t', 'social'],
    ['t', 'menu'],
  ],
}: {
  kind?: number;
  pubkey?: string;
  id?: string;
  createdAt?: number;
  tags?: string[][];
} = {}): ParsedEvent {
  return {
    kind: () => kind,
    pubkey: () => pubkey,
    id: () => id,
    createdAt: () => createdAt,
    tags: (index: number) => tags[index] ?? null,
    tagsLength: () => tags.length,
  } as unknown as ParsedEvent;
}

describe('NIP-53 room definition projection', () => {
  it('projects an anchor-admin room with its exact address and standard fields', () => {
    expect(projectRoomDefinition(fakeEvent(), trust, RELAY)).toEqual({
      id: 'skyline',
      address: `30312:${ADMIN}:skyline`,
      communityAddress: `31727:${ROOT}:community`,
      rootPubkey: ROOT,
      name: 'The Skyline Room',
      about: 'Rooftop jazz.',
      image: undefined,
      relayUrl: RELAY,
      operatorPubkey: ADMIN,
      serviceUrl: 'https://room.example/skyline',
      capabilities: ['social', 'menu'],
      status: 'open',
      open: true,
      verified: true,
    });
  });

  it('accepts the NIP-11 root and rejects authors outside the current anchor', () => {
    expect(projectRoomDefinition(fakeEvent({ pubkey: ROOT }), trust, RELAY)?.operatorPubkey).toBe(ROOT);
    expect(projectRoomDefinition(fakeEvent({ pubkey: OTHER }), trust, RELAY)).toBeNull();
  });

  it('retains an authorized preferred relay while the lookup relay stays the trust pin', () => {
    const room = projectRoomDefinition(fakeEvent(), trust, 'ws://10.0.2.2:8787');
    expect(room?.relayUrl).toBe(RELAY);
  });

  it('requires the NIP-53 d, room, status, service, and Host provider fields', () => {
    const base = [
      ['d', 'skyline'], ['room', 'Skyline'], ['status', 'private'],
      ['service', 'https://room.example'], ['p', ADMIN, RELAY, 'Host'],
    ];
    for (const required of ['d', 'room', 'status', 'service', 'p']) {
      expect(projectRoomDefinition(fakeEvent({ tags: base.filter(([name]) => name !== required) }), trust, RELAY)).toBeNull();
    }
    expect(projectRoomDefinition(fakeEvent({ tags: base.map((tag) => tag[0] === 'p' ? ['p', ADMIN, RELAY, 'Speaker'] : tag) }), trust, RELAY)).toBeNull();
    expect(projectRoomDefinition(fakeEvent({ tags: base.map((tag) => tag[0] === 'status' ? ['status', 'live'] : tag) }), trust, RELAY)).toBeNull();
  });

  it('uses created_at then the lowest id to choose among authorized definitions', () => {
    const room = projectRoomDefinition(fakeEvent(), trust, RELAY)!;
    const current = { eventId: 'f'.repeat(64), createdAt: 100, room };
    expect(isNewerRoomDefinition({ eventId: '0'.repeat(64), createdAt: 100, room }, current)).toBe(true);
    expect(isNewerRoomDefinition({ eventId: '0'.repeat(64), createdAt: 99, room }, current)).toBe(false);
  });
});

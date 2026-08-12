import type { ParsedEvent } from '@candypoets/nipworker';

import { isNewerRoomPresence, projectRoomPresence } from '@/rooms/presence';

const ROOT = 'a'.repeat(64);
const ADDRESS = `30312:${ROOT}:skyline`;
const PUBKEY = 'b'.repeat(64);

function fakeEvent({
  kind = 10312,
  id = 'e'.repeat(64),
  pubkey = PUBKEY,
  createdAt = 1_000,
  tags = [['a', ADDRESS], ['expiration', '2000']],
}: {
  kind?: number;
  id?: string;
  pubkey?: string;
  createdAt?: number;
  tags?: string[][];
} = {}): ParsedEvent {
  return {
    kind: () => kind,
    id: () => id,
    pubkey: () => pubkey,
    createdAt: () => createdAt,
    tags: (index: number) => tags[index] ?? null,
    tagsLength: () => tags.length,
  } as unknown as ParsedEvent;
}

describe('NIP-53 room presence projection', () => {
  it('projects active presence only for the exact NIP-53 room address', () => {
    expect(projectRoomPresence(fakeEvent({
      tags: [
        ['a', ADDRESS, 'wss://room.example', 'root'],
        ['intent', ' business '],
        ['context', `  ${'x'.repeat(100)}  `],
        ['expiration', '2000'],
      ],
    }), ADDRESS, 1_500)).toEqual({
      id: 'e'.repeat(64),
      pubkey: PUBKEY,
      intent: 'business',
      context: 'x'.repeat(80),
      expiresAt: 2_000,
      createdAt: 1_000,
      visible: true,
    });
  });

  it('uses a bounded freshness window for interoperable NIP-53 events without expiration', () => {
    const event = fakeEvent({ createdAt: 1_000, tags: [['a', ADDRESS]] });
    expect(projectRoomPresence(event, ADDRESS, 1_299)?.visible).toBe(true);
    expect(projectRoomPresence(event, ADDRESS, 1_300)?.visible).toBe(false);
    expect(projectRoomPresence(event, ADDRESS, 1_300)?.expiresAt).toBe(1_300);
  });

  it('projects an explicit leave as an immediate non-visible replacement', () => {
    const left = projectRoomPresence(fakeEvent({
      tags: [['a', ADDRESS], ['status', 'left'], ['expiration', '2000']],
    }), ADDRESS, 1_100);
    expect(left?.visible).toBe(false);
    expect(left?.expiresAt).toBe(2_000);
  });

  it('rejects another event kind, another room, and malformed expiration', () => {
    expect(projectRoomPresence(fakeEvent({ kind: 1 }), ADDRESS)).toBeNull();
    expect(projectRoomPresence(fakeEvent({ tags: [['a', `30312:${'c'.repeat(64)}:other`]] }), ADDRESS)).toBeNull();
    expect(projectRoomPresence(fakeEvent({ tags: [['a', ADDRESS], ['expiration', 'later']] }), ADDRESS)).toBeNull();
  });

  it('uses the NIP-01 lowest-id tie-break for equal timestamps', () => {
    const current = projectRoomPresence(fakeEvent({ id: 'f'.repeat(64) }), ADDRESS, 1_100)!;
    const lower = projectRoomPresence(fakeEvent({ id: '0'.repeat(64) }), ADDRESS, 1_100)!;
    const older = projectRoomPresence(fakeEvent({ id: '0'.repeat(64), createdAt: 999 }), ADDRESS, 1_100)!;
    expect(isNewerRoomPresence(lower, current)).toBe(true);
    expect(isNewerRoomPresence(current, lower)).toBe(false);
    expect(isNewerRoomPresence(older, current)).toBe(false);
  });
});

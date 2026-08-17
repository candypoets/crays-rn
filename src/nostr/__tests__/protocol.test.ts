import {
  CRAYS_PROTOCOL,
  communityAnchorAddress,
  leaveTemplate,
  presenceTemplate,
  roomDefinitionAddress,
  roomFeedTemplate,
  roomReactionTemplate,
  roomReplyTemplate,
} from '@/nostr/protocol';

describe('Crays protocol templates', () => {
  it('uses the NIP-53 room definition and presence kinds', () => {
    expect(CRAYS_PROTOCOL.roomDefinitionKind).toBe(30312);
    expect(CRAYS_PROTOCOL.roomPresenceKind).toBe(10312);
    expect(roomDefinitionAddress('a'.repeat(64), 'skyline')).toBe(`30312:${'a'.repeat(64)}:skyline`);
  });

  it('builds room feed notes with room context and expiry', () => {
    const event = roomFeedTemplate('skyline', 'Welcome upstairs.', 2_000_000_000);
    expect(event.kind).toBe(1);
    expect(event.content).toBe('Welcome upstairs.');
    expect(event.tags).toEqual(
      expect.arrayContaining([
        ['h', 'skyline'],
        ['expiration', '2000000000'],
      ]),
    );
  });

  it('adds Blossom media URLs and NIP-94 imeta to image notes', () => {
    const event = roomFeedTemplate('skyline', 'The dance floor.', 2_000_000_000, [{
      url: 'https://blossom.example/hash', mimeType: 'image/jpeg', width: 1200, height: 800, sha256: 'f'.repeat(64), alt: 'Dance floor',
    }]);
    expect(event.content).toBe('The dance floor.\nhttps://blossom.example/hash');
    expect(event.tags).toContainEqual(['imeta', 'url https://blossom.example/hash', 'm image/jpeg', 'dim 1200x800', `x ${'f'.repeat(64)}`, 'alt Dance floor']);
  });

  it('builds preferred marked NIP-10 tags for direct and nested room replies', () => {
    const direct = roomReplyTemplate({ roomId: 'skyline', relayUrl: 'wss://room.example', content: 'Direct', expiresAt: 2_000_000_000, parent: { id: 'root', pubkey: 'a'.repeat(64) } });
    expect(direct.tags.filter(([name]) => name === 'e')).toEqual([['e', 'root', 'wss://room.example', 'root', 'a'.repeat(64)]]);
    expect(direct.tags).toContainEqual(['p', 'a'.repeat(64), 'wss://room.example']);

    const nested = roomReplyTemplate({ roomId: 'skyline', relayUrl: 'wss://room.example', content: 'Nested', expiresAt: 2_000_000_000, parent: { id: 'reply', pubkey: 'b'.repeat(64), rootId: 'root', rootPubkey: 'a'.repeat(64), participantPubkeys: ['a'.repeat(64)] } });
    expect(nested.tags.filter(([name]) => name === 'e')).toEqual([
      ['e', 'root', 'wss://room.example', 'root', 'a'.repeat(64)],
      ['e', 'reply', 'wss://room.example', 'reply', 'b'.repeat(64)],
    ]);
    expect(nested.tags.filter(([name]) => name === 'p')).toHaveLength(2);
  });

  it('builds a room-scoped NIP-25 like with relay and author hints', () => {
    const event = roomReactionTemplate({ roomId: 'skyline', relayUrl: 'wss://room.example', targetId: 'note-id', targetPubkey: 'a'.repeat(64), expiresAt: 2_000_000_000 });
    expect(event.kind).toBe(7);
    expect(event.content).toBe('+');
    expect(event.tags).toEqual(expect.arrayContaining([
      ['e', 'note-id', 'wss://room.example', 'a'.repeat(64)],
      ['p', 'a'.repeat(64), 'wss://room.example'],
      ['k', '1'], ['h', 'skyline'], ['expiration', '2000000000'],
    ]));
  });

  it('builds the root-signed NIP-97 community address', () => {
    expect(communityAnchorAddress('A'.repeat(64))).toBe(`31727:${'a'.repeat(64)}:community`);
    expect(() => communityAnchorAddress('not-a-key')).toThrow('community root key');
  });

  it('publishes room-bound NIP-53 presence with bounded context and exact expiry', () => {
    const address = `30312:${'a'.repeat(64)}:skyline`;
    const visible = presenceTemplate({
      roomAddress: address,
      relayUrl: 'wss://room.example',
      intent: 'business',
      context: `  ${'x'.repeat(100)}  `,
      expiresAt: 2_000_000_000,
    });
    expect(visible.kind).toBe(10312);
    expect(visible.tags).toContainEqual([
      'a',
      address,
      'wss://room.example',
      'root',
    ]);
    expect(visible.tags).toContainEqual(['intent', 'business']);
    expect(visible.tags).toContainEqual(['context', 'x'.repeat(80)]);
    expect(visible.tags).toContainEqual(['expiration', '2000000000']);
    expect(visible.tags.some(([name]) => ['d', 'h', 'schema', 'type', 'visibility'].includes(name))).toBe(false);
  });

  it('leaving publishes a newer same-kind room-bound replacement', () => {
    const address = `30312:${'b'.repeat(64)}:skyline`;
    const left = leaveTemplate({
      roomAddress: address,
      relayUrl: 'wss://room.example',
      expiresAt: 2_000_000_000,
    });
    expect(left.kind).toBe(10312);
    expect(left.tags).toContainEqual(['status', 'left']);
    expect(left.tags).toContainEqual([
      'a',
      address,
      'wss://room.example',
      'root',
    ]);
    expect(left.tags).toContainEqual(['expiration', '2000000000']);
  });

  it('rejects presence without an exact kind-30312 address', () => {
    expect(() => presenceTemplate({
      roomAddress: `31727:${'a'.repeat(64)}:community`,
      relayUrl: 'wss://room.example',
      intent: 'social',
      expiresAt: 2_000_000_000,
    })).toThrow('NIP-53 room address');
  });
});

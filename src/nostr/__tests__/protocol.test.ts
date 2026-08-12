import {
  CRAYS_PROTOCOL,
  communityAnchorAddress,
  leaveTemplate,
  presenceTemplate,
  roomDefinitionAddress,
  roomFeedTemplate,
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

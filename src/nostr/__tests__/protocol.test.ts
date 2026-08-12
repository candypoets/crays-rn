import {
  CRAYS_PROTOCOL,
  communityAnchorAddress,
  leaveTemplate,
  pilotD,
  presenceTemplate,
  roomFeedTemplate,
} from '@/nostr/protocol';

describe('Crays pilot protocol templates', () => {
  it('keeps the deprecated room selector isolated and uses NIP-53 for presence', () => {
    expect(CRAYS_PROTOCOL.roomManifestKind).toBe(30078);
    expect(CRAYS_PROTOCOL.roomPresenceKind).toBe(10312);
    expect(pilotD.room('skyline')).toBe('life.crays/room/v1/skyline');
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

  it('publishes anchor-bound NIP-53 presence with bounded context and exact expiry', () => {
    const visible = presenceTemplate({
      communityRootPubkey: 'a'.repeat(64),
      relayUrl: 'wss://room.example',
      intent: 'business',
      context: `  ${'x'.repeat(100)}  `,
      expiresAt: 2_000_000_000,
    });
    expect(visible.kind).toBe(10312);
    expect(visible.tags).toContainEqual([
      'a',
      `31727:${'a'.repeat(64)}:community`,
      'wss://room.example',
      'root',
    ]);
    expect(visible.tags).toContainEqual(['intent', 'business']);
    expect(visible.tags).toContainEqual(['context', 'x'.repeat(80)]);
    expect(visible.tags).toContainEqual(['expiration', '2000000000']);
    expect(visible.tags.some(([name]) => ['d', 'h', 'schema', 'type', 'visibility'].includes(name))).toBe(false);
  });

  it('leaving publishes a newer same-kind anchor-bound replacement', () => {
    const left = leaveTemplate({
      communityRootPubkey: 'b'.repeat(64),
      relayUrl: 'wss://room.example',
      expiresAt: 2_000_000_000,
    });
    expect(left.kind).toBe(10312);
    expect(left.tags).toContainEqual(['status', 'left']);
    expect(left.tags).toContainEqual([
      'a',
      `31727:${'b'.repeat(64)}:community`,
      'wss://room.example',
      'root',
    ]);
    expect(left.tags).toContainEqual(['expiration', '2000000000']);
  });
});

import {
  CRAYS_PROTOCOL,
  leaveTemplate,
  pilotD,
  presenceTemplate,
  roomFeedTemplate,
} from '@/nostr/protocol';

describe('Crays pilot protocol templates', () => {
  it('uses a versioned NIP-78 namespace for unresolved room records', () => {
    expect(CRAYS_PROTOCOL.roomManifestKind).toBe(30078);
    expect(CRAYS_PROTOCOL.roomActivityKind).toBe(78);
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

  it('never turns quiet browsing into visible presence', () => {
    const quiet = presenceTemplate({
      roomId: 'skyline',
      pubkey: 'a'.repeat(64),
      visibility: 'quiet',
      expiresAt: 2_000_000_000,
    });
    expect(quiet.tags).toContainEqual(['visibility', 'quiet']);
    expect(quiet.tags).not.toContainEqual(['visibility', 'visible']);
    expect(quiet.tags).not.toContainEqual(expect.arrayContaining(['intent']));
  });

  it('publishes the selected intent, bounded context, and exact expiry for visible presence', () => {
    const visible = presenceTemplate({
      roomId: 'skyline',
      pubkey: 'a'.repeat(64),
      visibility: 'visible',
      intent: 'business',
      context: `  ${'x'.repeat(100)}  `,
      expiresAt: 2_000_000_000,
    });
    expect(visible.tags).toContainEqual(['intent', 'business']);
    expect(visible.tags).toContainEqual(['context', 'x'.repeat(80)]);
    expect(visible.tags).toContainEqual(['expiration', '2000000000']);
  });

  it('leaving replaces presence with an explicit left status', () => {
    const left = leaveTemplate('skyline', 'b'.repeat(64));
    expect(left.tags).toContainEqual(['status', 'left']);
    expect(left.tags).toContainEqual([
      'd',
      `life.crays/presence/v1/skyline/${'b'.repeat(64)}`,
    ]);
  });
});

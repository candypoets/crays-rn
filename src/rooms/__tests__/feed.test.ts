import { buildRoomThread, canContinueRoomPostOperation, roomFeedRoots, roomPostEngagement, roomThreadRootId } from '@/rooms/feed';
import type { RoomPost, RoomReaction } from '@/rooms/types';
import { parseRoomPostImage, stripRoomPostMediaUrls } from '@/rooms/projections';

const root: RoomPost = { id: 'root', pubkey: 'a'.repeat(64), content: 'Root', createdAt: 1, announcement: false, expiresAt: 2_000_000_000, images: [], participantPubkeys: [] };
const direct: RoomPost = { ...root, id: 'direct', pubkey: 'b'.repeat(64), content: 'Direct', createdAt: 2, replyToId: root.id, rootId: root.id, rootPubkey: root.pubkey };
const nested: RoomPost = { ...root, id: 'nested', pubkey: 'c'.repeat(64), content: 'Nested', createdAt: 3, replyToId: direct.id, rootId: root.id, rootPubkey: root.pubkey };

describe('room feed projection logic', () => {
  it('continues an upload only for the live composer operation and room lease', () => {
    const base = { currentOperationId: 2, leaveAt: 2_000, mounted: true, now: 1_000, operationId: 2 };
    expect(canContinueRoomPostOperation(base)).toBe(true);
    expect(canContinueRoomPostOperation({ ...base, mounted: false })).toBe(false);
    expect(canContinueRoomPostOperation({ ...base, operationId: 1 })).toBe(false);
    expect(canContinueRoomPostOperation({ ...base, now: 2_000 })).toBe(false);
  });

  it('keeps replies out of the timeline and builds a stable indented thread', () => {
    expect(roomFeedRoots([nested, root, direct])).toEqual([root]);
    expect(roomThreadRootId(nested)).toBe(root.id);
    expect(buildRoomThread([nested, root, direct], root.id).map((post) => [post.id, post.depth])).toEqual([
      [root.id, 0], [direct.id, 1], [nested.id, 2],
    ]);
    expect(buildRoomThread([direct], 'missing')).toEqual([]);
  });

  it('deduplicates likes by author and counts every response in the root thread', () => {
    const reactions: RoomReaction[] = [
      { id: 'one', pubkey: 'd'.repeat(64), targetId: root.id, createdAt: 1, expiresAt: 2_000_000_000 },
      { id: 'two', pubkey: 'd'.repeat(64), targetId: root.id, createdAt: 2, expiresAt: 2_000_000_000 },
      { id: 'three', pubkey: 'e'.repeat(64), targetId: root.id, createdAt: 3, expiresAt: 2_000_000_000 },
    ];
    expect(roomPostEngagement(root, [root, direct, nested], reactions, 'd'.repeat(64))).toEqual({ likedByViewer: true, likeCount: 2, replyCount: 2 });
  });

  it('parses NIP-94 imeta without flattening unrelated event data', () => {
    expect(parseRoomPostImage(['imeta', 'url https://cdn.example/photo.jpg', 'm image/jpeg', 'dim 1200x800', `x ${'f'.repeat(64)}`, 'alt Dance floor at midnight'])).toEqual({
      url: 'https://cdn.example/photo.jpg', mimeType: 'image/jpeg', width: 1200, height: 800, sha256: 'f'.repeat(64), alt: 'Dance floor at midnight',
    });
    expect(parseRoomPostImage(['imeta', 'url javascript:alert(1)'])).toBeNull();
  });

  it('keeps prose while hiding media URLs appended to kind-1 content', () => {
    const image = parseRoomPostImage(['imeta', 'url https://cdn.example/photo.jpg', 'm image/jpeg']);
    expect(stripRoomPostMediaUrls('A room moment\nhttps://cdn.example/photo.jpg', image ? [image] : [])).toBe('A room moment');
    expect(stripRoomPostMediaUrls('https://cdn.example/photo.jpg', image ? [image] : [])).toBe('');
  });
});

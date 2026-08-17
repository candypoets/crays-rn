import type { RoomPost, RoomReaction } from '@/rooms/types';

export type RoomThreadPost = RoomPost & { depth: number };

export type RoomPostEngagement = {
  likedByViewer: boolean;
  likeCount: number;
  replyCount: number;
};

export function canContinueRoomPostOperation({
  currentOperationId,
  leaveAt,
  mounted,
  now,
  operationId,
}: {
  currentOperationId: number;
  leaveAt: number;
  mounted: boolean;
  now: number;
  operationId: number;
}): boolean {
  return mounted && operationId === currentOperationId && leaveAt > now;
}

export function roomThreadRootId(post: RoomPost): string {
  return post.rootId || post.id;
}

export function roomFeedRoots(posts: readonly RoomPost[]): RoomPost[] {
  return posts.filter((post) => !post.replyToId);
}

export function buildRoomThread(posts: readonly RoomPost[], rootId: string): RoomThreadPost[] {
  const root = posts.find((post) => post.id === rootId);
  if (!root) return [];
  const replies = posts
    .filter((post) => post.id !== rootId && (post.rootId === rootId || post.replyToId === rootId))
    .sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id));
  const depthById = new Map<string, number>([[rootId, 0]]);
  return [root, ...replies].map((post) => {
    if (post.id === rootId) return { ...post, depth: 0 };
    const parentDepth = depthById.get(post.replyToId || rootId) ?? 0;
    const depth = Math.min(3, parentDepth + 1);
    depthById.set(post.id, depth);
    return { ...post, depth };
  });
}

export function roomPostEngagement(
  post: RoomPost,
  posts: readonly RoomPost[],
  reactions: readonly RoomReaction[],
  viewerPubkey?: string | null,
): RoomPostEngagement {
  const likedBy = new Set(reactions.filter((reaction) => reaction.targetId === post.id).map((reaction) => reaction.pubkey));
  const rootId = roomThreadRootId(post);
  return {
    likedByViewer: Boolean(viewerPubkey && likedBy.has(viewerPubkey)),
    likeCount: likedBy.size,
    replyCount: posts.filter((candidate) => candidate.id !== rootId && (candidate.rootId === rootId || candidate.replyToId === rootId)).length,
  };
}

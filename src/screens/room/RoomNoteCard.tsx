import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { PortraitImage } from '@/components/night/NightPrimitives';
import type { RoomPost, RoomProfile } from '@/rooms/types';
import { colors } from '@/theme/colors';

export type RoomNoteCardProps = {
  post: RoomPost;
  profile?: RoomProfile;
  liked: boolean;
  likeCount: number;
  replyCount: number;
  liking: boolean;
  reporting: boolean;
  onLike: () => void;
  onMessage: () => void;
  onOpenPerson: () => void;
  onOpenThread?: () => void;
  onReply: () => void;
  onReport: () => void;
  depth?: number;
};

function formatMoment(epoch: number) {
  if (!epoch || !Number.isFinite(epoch)) return '—';
  return new Date(epoch * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function PostImages({ post }: { post: RoomPost }) {
  if (!post.images.length) return null;
  return (
    <View className="mt-3 flex-row flex-wrap gap-1.5 overflow-hidden rounded-2xl bg-surface-soft" pointerEvents="none" testID="room-post-image">
      {post.images.slice(0, 4).map((image) => (
        <Image
          accessibilityLabel={image.alt || 'Room post image'}
          key={image.url}
          resizeMode="cover"
          source={{ uri: image.url }}
          style={{ aspectRatio: 4 / 3, width: post.images.length === 1 ? '100%' : '49%' }}
        />
      ))}
    </View>
  );
}

function FooterAction({
  accessibilityLabel,
  count,
  disabled,
  icon,
  onPress,
  selected,
  testID,
}: {
  accessibilityLabel: string;
  count?: number;
  disabled?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  selected?: boolean;
  testID: string;
}) {
  const tint = selected ? colors.commitment : colors.inkMuted;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled), selected: Boolean(selected) }}
      className="min-h-12 min-w-12 flex-row items-center justify-center gap-1 px-1 disabled:opacity-45"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      <Ionicons color={tint} name={icon} size={18} />
      {count ? <Text className={selected ? 'text-xs font-black text-commitment' : 'text-xs font-bold text-muted'}>{count}</Text> : null}
    </Pressable>
  );
}

export function RoomNoteCard({
  depth = 0,
  liked,
  likeCount,
  liking,
  onLike,
  onMessage,
  onOpenPerson,
  onOpenThread,
  onReply,
  onReport,
  post,
  profile,
  replyCount,
  reporting,
}: RoomNoteCardProps) {
  const authorName = profile?.name || (post.announcement ? 'The room' : 'Room guest');
  const noteContent = (
    <>
      {post.content ? <Text className="mt-1 text-base leading-6 text-ink">{post.content}</Text> : null}
      <PostImages post={post} />
    </>
  );
  return (
    <View
      className={`mb-3 rounded-2xl border px-4 pt-4 ${post.announcement ? 'border-primary/25 bg-surface-soft' : 'border-edge bg-surface'}`}
      style={depth ? { marginLeft: Math.min(depth, 3) * 14 } : undefined}
      testID={`post-${post.id}`}
    >
      <View className="flex-row items-start">
        {post.announcement ? (
          <View className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary">
            <Ionicons color={colors.surface} name="megaphone" size={20} />
          </View>
        ) : (
          <PortraitImage
            className="h-11 w-11 shrink-0 rounded-full"
            identity={post.pubkey}
            label={`Profile image for ${authorName}`}
            picture={profile?.picture}
          />
        )}
        <View className="ml-3 min-w-0 flex-1">
          <Pressable
            accessibilityLabel={`Open profile of ${authorName}`}
            accessibilityRole="button"
            className="min-h-12 justify-center"
            onPress={onOpenPerson}
            testID={`post-author-${post.id}`}
          >
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
              <Text className="text-[15px] font-black text-ink">{authorName}</Text>
              <Text className="text-xs text-muted">{formatMoment(post.createdAt)}</Text>
              {post.announcement ? (
                <Text className="rounded-full bg-surface px-2 py-1 text-[9px] font-black uppercase text-primary">Announcement</Text>
              ) : null}
            </View>
          </Pressable>
          {onOpenThread ? (
            <Pressable
              accessibilityLabel={`Open thread by ${authorName}, ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
              accessibilityRole="button"
              className="pb-1"
              onPress={onOpenThread}
              testID={`open-thread-${post.id}`}
            >
              {noteContent}
            </Pressable>
          ) : <View className="pb-1">{noteContent}</View>}
        </View>
      </View>
      <View className="mt-2 flex-row items-center justify-between border-t border-edge/70">
        <FooterAction accessibilityLabel={`Reply to ${authorName}${replyCount ? `, ${replyCount} replies` : ''}`} count={replyCount} icon="chatbubble-outline" onPress={onReply} testID={`reply-post-${post.id}`} />
        <FooterAction accessibilityLabel={`${liked ? 'Liked' : 'Like'} post by ${authorName}${likeCount ? `, ${likeCount} likes` : ''}`} count={likeCount} disabled={liked || liking} icon={liked ? 'heart' : 'heart-outline'} onPress={onLike} selected={liked} testID={`like-post-${post.id}`} />
        <FooterAction accessibilityLabel={`Message ${authorName}`} icon="paper-plane-outline" onPress={onMessage} testID={`message-post-${post.id}`} />
        <FooterAction accessibilityLabel={`Report post by ${authorName}`} disabled={reporting} icon="flag-outline" onPress={onReport} testID={`report-post-${post.id}`} />
      </View>
    </View>
  );
}

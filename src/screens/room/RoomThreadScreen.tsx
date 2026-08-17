// THESIS: One room note becomes a focused conversation without leaving the room context.
// OWNED WORLD: The root note leads; responses step inward on the Night Playlist canvas.
// STORY: Read the post, follow its responses in order, then answer or react.
// FIRST VIEWPORT: Back, room identity, root note, and the reply action are immediately available.
// FORM: Missing, loading, empty-response, relay-action, and expiry states remain explicit.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { roomPostEngagement, type RoomThreadPost } from '@/rooms/feed';
import type { RoomPost, RoomProfile, RoomReaction } from '@/rooms/types';
import { RoomNoteCard } from '@/screens/room/RoomNoteCard';
import { colors } from '@/theme/colors';

type RoomThreadScreenProps = {
  roomName: string;
  thread: RoomThreadPost[];
  loading: boolean;
  profiles: ReadonlyMap<string, RoomProfile>;
  reactions: RoomReaction[];
  viewerPubkey?: string | null;
  likedPostIds?: ReadonlySet<string>;
  likingPostId?: string | null;
  reportingPostId?: string | null;
  notice?: string | null;
  onBack: () => void;
  onLike: (post: RoomPost) => void;
  onMessage: (post: RoomPost) => void;
  onOpenPerson: (post: RoomPost) => void;
  onReply: (post: RoomPost) => void;
  onReport: (post: RoomPost) => void;
};

export function RoomThreadScreen(props: RoomThreadScreenProps) {
  const insets = useSafeAreaInsets();
  const root = props.thread[0];
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['left', 'right']} testID="room-thread-screen">
      <View className="border-b border-edge bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="mx-auto w-full max-w-[620px] flex-row items-center">
          <Pressable accessibilityLabel="Back to room feed" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full active:bg-surface-soft" onPress={props.onBack} testID="close-room-thread">
            <Ionicons color={colors.ink} name="arrow-back" size={24} />
          </Pressable>
          <View className="ml-2 min-w-0 flex-1">
            <Text accessibilityRole="header" className="text-xl font-black text-ink">Post</Text>
            <Text className="text-xs text-muted" numberOfLines={1}>{props.roomName} · room thread</Text>
          </View>
          {root ? (
            <Pressable accessibilityLabel="Reply to this post" accessibilityRole="button" className="min-h-12 flex-row items-center gap-2 rounded-xl bg-primary px-4" onPress={() => props.onReply(root)} testID="reply-to-thread">
              <Ionicons color={colors.surface} name="chatbubble-outline" size={18} />
              <Text className="font-black text-surface">Reply</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView contentContainerClassName="mx-auto w-full max-w-[620px] px-5 pb-12 pt-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {props.notice ? <Text accessibilityRole="alert" className="mb-4 text-sm font-semibold text-muted">{props.notice}</Text> : null}
        {props.loading && !root ? <ActivityIndicator className="mt-12" color={colors.primary} testID="room-thread-loading" /> : null}
        {!props.loading && !root ? (
          <View className="mt-10 items-center rounded-2xl border border-edge bg-surface px-6 py-10">
            <Ionicons color={colors.inkMuted} name="chatbubble-ellipses-outline" size={30} />
            <Text className="mt-3 text-center text-lg font-black text-ink">This post is unavailable</Text>
            <Text className="mt-1 text-center text-sm leading-5 text-muted">It may have expired, been removed, or not reached this room relay.</Text>
          </View>
        ) : null}
        {props.thread.map((post, index) => {
          const engagement = roomPostEngagement(post, props.thread, props.reactions, props.viewerPubkey);
          const optimisticLiked = props.likedPostIds?.has(post.id) && !engagement.likedByViewer;
          return (
            <View key={post.id}>
              {index === 1 ? (
                <View className="mb-3 mt-2 flex-row items-center gap-3">
                  <View className="h-px flex-1 bg-edge" />
                  <Text className="text-xs font-black uppercase tracking-[0.7px] text-muted">Responses</Text>
                  <View className="h-px flex-1 bg-edge" />
                </View>
              ) : null}
              <RoomNoteCard
                depth={post.depth}
                liked={engagement.likedByViewer || Boolean(optimisticLiked)}
                likeCount={engagement.likeCount + (optimisticLiked ? 1 : 0)}
                liking={props.likingPostId === post.id}
                onLike={() => props.onLike(post)}
                onMessage={() => props.onMessage(post)}
                onOpenPerson={() => props.onOpenPerson(post)}
                onReply={() => props.onReply(post)}
                onReport={() => props.onReport(post)}
                post={post}
                profile={props.profiles.get(post.pubkey)}
                replyCount={engagement.replyCount}
                reporting={props.reportingPostId === post.id}
              />
            </View>
          );
        })}
        {root && props.thread.length === 1 ? (
          <View className="items-center py-8">
            <Text className="text-sm font-bold text-muted">No responses yet</Text>
            <Pressable accessibilityLabel="Write the first reply" accessibilityRole="button" className="mt-3 min-h-12 justify-center rounded-xl border border-primary px-5" onPress={() => props.onReply(root)}>
              <Text className="font-black text-primary">Write the first reply</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

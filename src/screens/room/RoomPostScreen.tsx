// THESIS: Posting is a focused act, separate from reading the room feed.
// OWNED WORLD: A clean Night Playlist sheet with one draft, one audience, and visible media state.
// STORY: Confirm the room or reply target, write, optionally attach photos, then publish once.
// FIRST VIEWPORT: Close, audience, reply context, editor, and Post action are visible together.
// FORM: Permission, selection, upload, relay rejection, retry, and expiry truth stay explicit.
import { Ionicons } from '@expo/vector-icons';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LocalRoomImage } from '@/media/blossom';
import type { ActiveRoom, RoomPost, RoomProfile } from '@/rooms/types';
import { colors } from '@/theme/colors';

export type RoomPostPhase = 'idle' | 'selecting' | 'uploading' | 'publishing';

type RoomPostScreenProps = {
  activeRoom: ActiveRoom;
  attachments: LocalRoomImage[];
  draft: string;
  error?: string | null;
  parent?: RoomPost;
  parentProfile?: RoomProfile;
  phase: RoomPostPhase;
  replyTargetMissing?: boolean;
  onAddImages: () => void;
  onChangeDraft: (value: string) => void;
  onClose: () => void;
  onPublish: () => void;
  onRemoveImage: (uri: string) => void;
};

function busyLabel(phase: RoomPostPhase) {
  if (phase === 'selecting') return 'Opening photos…';
  if (phase === 'uploading') return 'Uploading photos…';
  if (phase === 'publishing') return 'Publishing…';
  return null;
}

export function RoomPostScreen(props: RoomPostScreenProps) {
  const insets = useSafeAreaInsets();
  const busy = props.phase !== 'idle';
  const hasContent = Boolean(props.draft.trim() || props.attachments.length);
  const canPublish = hasContent && !busy && !props.replyTargetMissing;
  const parentName = props.parentProfile?.name || (props.parent?.announcement ? 'The room' : 'Room guest');
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['left', 'right']} testID="room-post-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="border-b border-edge bg-surface px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
          <View className="mx-auto w-full max-w-[620px] flex-row items-center justify-between">
            <Pressable accessibilityLabel="Close post composer" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full active:bg-surface-soft" disabled={busy} onPress={props.onClose} testID="close-room-post">
              <Ionicons color={colors.ink} name="close" size={25} />
            </Pressable>
            <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
              <Text accessibilityRole="header" className="text-base font-black text-ink">{props.parent ? 'Reply' : 'New post'}</Text>
              <Text className="text-[11px] text-muted">{props.activeRoom.name}</Text>
            </View>
            <Pressable
              accessibilityLabel={busyLabel(props.phase) || (props.parent ? 'Publish reply' : 'Publish post')}
              accessibilityRole="button"
              accessibilityState={{ busy, disabled: !canPublish }}
              className="min-h-12 min-w-[78px] items-center justify-center rounded-xl bg-primary px-4 disabled:opacity-40"
              disabled={!canPublish}
              onPress={props.onPublish}
              testID="publish-room-post"
            >
              <Text className="font-black text-surface">{busyLabel(props.phase) || 'Post'}</Text>
            </Pressable>
          </View>
        </View>
        <ScrollView contentContainerClassName="mx-auto w-full max-w-[620px] px-5 pb-12 pt-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full bg-verified" />
            <Text className="text-xs font-black text-ink">Posting in {props.activeRoom.name}</Text>
          </View>
          <Text className="mt-1 text-xs leading-5 text-muted">Visible through this room relay and locked when your room session ends.</Text>

          {props.replyTargetMissing ? (
            <View className="mt-5 rounded-2xl border border-error/30 bg-surface px-4 py-4">
              <Text accessibilityRole="alert" className="font-black text-error">The post you wanted to reply to is unavailable.</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">Close this composer and reopen the thread after the room reconnects.</Text>
            </View>
          ) : null}
          {props.parent ? (
            <View className="mt-5 rounded-2xl border border-edge bg-surface-soft px-4 py-3" testID="reply-context">
              <Text className="text-xs font-black text-primary">Replying to {parentName}</Text>
              <Text className="mt-1 text-sm leading-5 text-ink" numberOfLines={3}>{props.parent.content || 'Photo post'}</Text>
            </View>
          ) : null}
          {props.error ? <Text accessibilityRole="alert" className="mt-4 text-sm font-semibold leading-5 text-error">{props.error}</Text> : null}

          <TextInput
            accessibilityLabel={props.parent ? `Write a reply to ${parentName}` : 'Write a room post'}
            autoFocus
            className="mt-5 min-h-[180px] rounded-2xl border border-edge bg-surface px-4 py-4 text-[17px] leading-7 text-ink"
            editable={!busy}
            maxLength={500}
            multiline
            onChangeText={props.onChangeDraft}
            placeholder={props.parent ? `Reply to ${parentName}…` : 'What is happening in the room?'}
            placeholderTextColor={colors.placeholder}
            textAlignVertical="top"
            testID="room-post-input"
            value={props.draft}
          />
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-xs text-muted">Plain text · room only</Text>
            <Text className="text-xs font-bold text-muted">{props.draft.length}/500</Text>
          </View>

          {props.attachments.length ? (
            <View className="mt-5 flex-row flex-wrap gap-2" testID="room-post-attachments">
              {props.attachments.map((image) => (
                <View className="relative w-[48%] overflow-hidden rounded-2xl bg-surface-soft" key={image.uri}>
                  <Image accessibilityLabel={image.fileName || 'Selected room photo'} className="aspect-square w-full" resizeMode="cover" source={{ uri: image.uri }} />
                  <Pressable accessibilityLabel={`Remove ${image.fileName || 'selected photo'}`} accessibilityRole="button" className="absolute right-2 top-2 h-10 w-10 items-center justify-center rounded-full bg-photo-night/80" disabled={busy} onPress={() => props.onRemoveImage(image.uri)}>
                    <Ionicons color={colors.surface} name="close" size={20} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityLabel={props.attachments.length ? `Add more photos, ${props.attachments.length} of 4 selected` : 'Add photos to this post'}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy || props.attachments.length >= 4 }}
            className="mt-5 min-h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-primary bg-surface px-4 disabled:opacity-40"
            disabled={busy || props.attachments.length >= 4}
            onPress={props.onAddImages}
            testID="add-room-post-images"
          >
            <Ionicons color={colors.primary} name="images-outline" size={21} />
            <Text className="font-black text-primary">{props.attachments.length ? 'Add more photos' : 'Add photos'}</Text>
          </Pressable>
          <Text className="mt-2 text-center text-xs leading-5 text-muted">You choose the photos first. Crays uploads them to Blossom only after you tap Post. Up to 4 images, 10 MB each.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

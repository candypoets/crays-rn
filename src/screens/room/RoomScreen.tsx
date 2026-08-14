// THESIS: The active room is one verified place shared by the people who chose to appear.
// OWNED WORLD: Session timing, portrait stickers, and chronological notes.
// STORY: Confirm the verified room → see opted-in people or read the room feed.
// FIRST VIEWPORT: Room identity, session boundary, connection truth, and useful content stay visible.
// FORM: Relay, quiet, empty, publish-failure, report, and expiry truth remain explicit.
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PortraitImage } from '@/components/night/NightPrimitives';
import type { ActiveRoom, RoomPerson, RoomPost, RoomProfile } from '@/rooms/types';
import { colors } from '@/theme/colors';

export type RoomView = 'people' | 'feed';

type RoomScreenProps = {
  activeRoom: ActiveRoom;
  connected: boolean;
  loading: boolean;
  people: RoomPerson[];
  posts: RoomPost[];
  profiles: ReadonlyMap<string, RoomProfile>;
  view: RoomView;
  composer: string;
  composerError?: string | null;
  composerLoading?: boolean;
  onChangeComposer: (value: string) => void;
  onChangeView: (view: RoomView) => void;
  onLeave: () => void;
  onMenu: () => void;
  onMyNight: () => void;
  onOpenPerson: (pubkey: string) => void;
  onPublish: () => void;
  onReportPost: (post: RoomPost) => void;
  reportingPostId?: string | null;
  reportNotice?: string | null;
};

function formatMoment(epoch: number, unit: 'milliseconds' | 'seconds' = 'seconds') {
  if (!epoch || !Number.isFinite(epoch)) return '—';
  return new Date(unit === 'seconds' ? epoch * 1000 : epoch).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatCredentialExpiry(epochSeconds: number) {
  if (!epochSeconds || !Number.isFinite(epochSeconds)) return '—';
  const expiry = new Date(epochSeconds * 1000);
  const time = expiry.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (expiry.toDateString() === new Date().toDateString()) return time;
  const date = expiry.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return `${date} · ${time}`;
}

function HeaderButton({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="h-12 w-12 items-center justify-center rounded-full border border-edge bg-surface active:bg-surface-soft"
      hitSlop={4}
      onPress={onPress}
      testID={testID}
    >
      <Ionicons color={colors.ink} name={icon} size={23} />
    </Pressable>
  );
}

function RoomHeader(props: Pick<RoomScreenProps, 'activeRoom' | 'connected' | 'onChangeView' | 'onLeave' | 'onMenu' | 'onMyNight' | 'view'>) {
  return (
    <View className="border-b border-edge bg-surface-soft px-5 pb-4 pt-2">
      <View className="flex-row items-start justify-between gap-3">
        <HeaderButton icon="chevron-down" label="Leave room" onPress={props.onLeave} testID="room-leave" />
        <View className="min-w-0 flex-1 pt-1">
          <Text accessibilityRole="header" className="text-[24px] font-black uppercase leading-7 tracking-[-0.7px] text-primary">
            {props.activeRoom.name}
          </Text>
          <View accessibilityRole="tablist" className="mt-1 flex-row items-center gap-3">
            {(['people', 'feed'] as const).map((tab) => {
              const selected = props.view === tab;
              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  className="min-h-12 justify-center"
                  key={tab}
                  onPress={() => props.onChangeView(tab)}
                  testID={`room-${tab}-tab`}
                >
                  <Text className={`text-xs font-black uppercase tracking-[0.5px] ${selected ? 'text-primary' : 'text-muted'}`}>
                    / {tab === 'people' ? 'Right now' : 'Feed'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View className="mt-1 flex-row items-center gap-1.5">
            <View className={`h-2 w-2 rounded-full ${props.connected ? 'bg-success' : 'bg-attention'}`} />
            <Text className="text-xs font-semibold text-muted">
              {props.connected ? 'Connected in the room' : 'Connecting to this room…'}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <HeaderButton icon="ticket-outline" label="Open My night" onPress={props.onMyNight} testID="room-my-night" />
          <HeaderButton icon="options-outline" label="Open room menu" onPress={props.onMenu} testID="room-menu" />
        </View>
      </View>
    </View>
  );
}

function RoomSessionRail({ room }: { room: ActiveRoom }) {
  const timing = [
    { label: 'Joined', value: formatMoment(room.joinedAt, 'milliseconds') },
    { label: 'Leave at', value: formatCredentialExpiry(Math.floor(room.leaveAt / 1000)) },
  ];
  return (
    <View
      accessibilityLabel={`Room session. Joined ${timing[0].value}. Leave at ${timing[1].value}.`}
      accessible
      className="border-b border-edge bg-surface"
    >
      <View className="flex-row px-5">
        {timing.map((item, index) => (
          <View
            className={`min-h-[66px] flex-1 justify-center ${index === 0 ? 'items-start border-r border-edge pr-5' : 'items-end pl-5'}`}
            key={item.label}
          >
            <Text className="text-[10px] font-black uppercase tracking-[0.6px] text-muted">{item.label}</Text>
            <Text className="mt-1 text-sm font-bold text-ink">{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyRoom({ children, icon }: { children: ReactNode; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="mt-6 items-center border-y border-dashed border-edge bg-surface px-6 py-10">
      <Ionicons color={colors.primary} name={icon} size={34} />
      <Text className="mt-4 max-w-[320px] text-center text-base leading-6 text-muted">{children}</Text>
    </View>
  );
}

function PersonCard({ index, onPress, person }: { index: number; onPress: () => void; person: RoomPerson }) {
  return (
    <Pressable
      accessibilityHint="Opens their room profile"
      accessibilityLabel={`${person.name}, ${person.intent}${person.context ? `, ${person.context}` : ''}`}
      accessibilityRole="button"
      className="mr-3 min-h-[156px] w-[92px] active:opacity-75"
      onPress={onPress}
      testID={`person-${person.pubkey}`}
    >
      <PortraitImage className="h-[104px] w-[92px] rounded-[26px]" index={index} label={`Portrait of ${person.name}`} />
      <Text className="mt-2 text-[15px] font-black uppercase text-ink">{person.name}</Text>
      <Text className="mt-0.5 text-[10px] font-black uppercase tracking-[0.4px] text-primary">{person.intent}</Text>
    </Pressable>
  );
}

function PeopleView({ activeRoom, loading, onOpenPerson, people }: Pick<RoomScreenProps, 'activeRoom' | 'loading' | 'onOpenPerson' | 'people'>) {
  if (loading) return <ActivityIndicator className="mt-12" color={colors.primary} />;
  if (!people.length) {
    return (
      <EmptyRoom icon="people-outline">
        {activeRoom.visibility === 'quiet'
          ? 'You are browsing quietly. Only people who chose to be visible appear here.'
          : 'No visible profiles have arrived from this room yet.'}
      </EmptyRoom>
    );
  }

  return (
    <>
      <View className="mt-6 flex-row items-end justify-between px-5">
        <Text accessibilityRole="header" className="text-xs font-black uppercase tracking-[0.7px] text-ink">People here · {people.length} visible</Text>
        <Text className="text-[11px] text-muted">No distance or ranking</Text>
      </View>
      <ScrollView
        accessibilityLabel={`${people.length} visible people`}
        className="mt-4"
        contentContainerClassName="px-5 pr-8"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {people.map((person, index) => <PersonCard index={index} key={person.pubkey} onPress={() => onOpenPerson(person.pubkey)} person={person} />)}
      </ScrollView>
    </>
  );
}

function FeedPost({
  index,
  onOpenPerson,
  onReportPost,
  post,
  profile,
  reporting,
}: {
  index: number;
  onOpenPerson: () => void;
  onReportPost: () => void;
  post: RoomPost;
  profile?: RoomProfile;
  reporting: boolean;
}) {
  return (
    <View className="relative flex-row" testID={`post-${post.id}`}>
      <View className="w-12 items-center">
        <View className={`mt-3 h-4 w-4 rounded-full border-2 border-surface ${post.announcement ? 'bg-primary' : 'bg-ink'}`} />
      </View>
      <View className={`mb-4 min-w-0 flex-1 rounded-2xl border p-4 ${post.announcement ? 'border-primary/20 bg-surface-soft' : 'border-edge bg-surface'}`}>
        <View className="flex-row items-center gap-3">
          {post.announcement ? (
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Ionicons color={colors.surface} name="megaphone" size={20} />
            </View>
          ) : (
            <PortraitImage className="h-10 w-10 rounded-full" index={index} label={`Portrait of ${profile?.name || 'room guest'}`} />
          )}
          <Pressable accessibilityLabel={`Open profile of ${profile?.name || 'room guest'}`} accessibilityRole="button" className="min-h-12 flex-1 justify-center" onPress={onOpenPerson} testID={`post-author-${post.id}`}>
            <Text className="text-xs font-black uppercase text-ink">{profile?.name || (post.announcement ? 'The room' : 'Room guest')}</Text>
            <Text className="mt-0.5 text-[10px] text-muted">{formatMoment(post.createdAt)}</Text>
          </Pressable>
          {post.announcement ? <Text className="rounded-full bg-surface px-2 py-1 text-[9px] font-black uppercase text-primary">Announcement</Text> : null}
        </View>
        <Text className="mt-3 text-base leading-6 text-ink">{post.content}</Text>
        <View className="mt-3 flex-row gap-5">
          <Pressable accessibilityLabel={`Message ${profile?.name || 'room guest'}`} accessibilityRole="button" className="min-h-12 justify-center" onPress={onOpenPerson} testID={`message-post-${post.id}`}>
            <Text className="text-xs font-black text-primary">Message</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Report post by ${profile?.name || 'room guest'}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: reporting }}
            className="min-h-12 justify-center"
            disabled={reporting}
            onPress={onReportPost}
            testID={`report-post-${post.id}`}
          >
            <Text className="text-xs font-bold text-muted">{reporting ? 'Reporting…' : 'Report'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function FeedView(props: Pick<RoomScreenProps, 'composer' | 'composerError' | 'composerLoading' | 'loading' | 'onChangeComposer' | 'onOpenPerson' | 'onPublish' | 'onReportPost' | 'posts' | 'profiles' | 'reportingPostId' | 'reportNotice'>) {
  return (
    <View className="px-5 pb-8 pt-5">
      <View className="flex-row items-end justify-between">
        <View>
          <Text accessibilityRole="header" className="text-xs font-black uppercase tracking-[0.7px] text-ink">Room feed</Text>
          <Text className="mt-1 text-sm text-muted">Chronological · locks when you leave</Text>
        </View>
      </View>

      {props.composerError ? <Text accessibilityRole="alert" className="mt-3 text-sm font-semibold text-error">{props.composerError}</Text> : null}
      {props.reportNotice ? <Text accessibilityRole="alert" className="mt-3 text-sm font-semibold text-muted">{props.reportNotice}</Text> : null}
      {props.loading ? <ActivityIndicator className="mt-10" color={colors.primary} /> : null}
      {!props.loading && !props.posts.length ? <EmptyRoom icon="chatbubble-ellipses-outline">No room posts yet. Venue announcements and guest posts will appear here.</EmptyRoom> : null}

      <View className="relative mt-5">
        {props.posts.length ? <View className="absolute bottom-3 left-[23px] top-3 w-px bg-edge" /> : null}
        {props.posts.map((post, index) => (
          <FeedPost
            index={index}
            key={post.id}
            onOpenPerson={() => props.onOpenPerson(post.pubkey)}
            onReportPost={() => props.onReportPost(post)}
            post={post}
            profile={props.profiles.get(post.pubkey)}
            reporting={props.reportingPostId === post.id}
          />
        ))}
      </View>

      <View className="mt-2 overflow-hidden rounded-2xl border-2 border-primary bg-surface">
        <View className="flex-row items-end gap-2 p-2 pl-4">
          <TextInput
            accessibilityLabel="Write a room post"
            className="min-h-12 flex-1 py-3 text-base leading-6 text-ink"
            maxLength={500}
            multiline
            onChangeText={props.onChangeComposer}
            placeholder="Add a note to this room"
            placeholderTextColor={colors.placeholder}
            testID="room-post-input"
            value={props.composer}
          />
          <Pressable
            accessibilityLabel="Post to this room"
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(props.composerLoading) || !props.composer.trim() }}
            className="h-12 min-w-12 items-center justify-center rounded-xl bg-primary px-3 disabled:opacity-40"
            disabled={props.composerLoading || !props.composer.trim()}
            onPress={props.onPublish}
            testID="publish-room-post"
          >
            {props.composerLoading ? <ActivityIndicator color={colors.surface} /> : <Ionicons color={colors.surface} name="add" size={25} />}
          </Pressable>
        </View>
        <View className="flex-row justify-between border-t border-edge px-4 py-2">
          <Text className="text-[11px] font-black uppercase text-primary">Add a note</Text>
          <Text className="text-[11px] text-muted">{props.composer.length}/500</Text>
        </View>
      </View>
    </View>
  );
}

export function RoomScreen(props: RoomScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      className="flex-1 bg-canvas"
      edges={['left', 'right']}
      testID={props.view === 'people' ? 'room-people-screen' : 'room-feed-screen'}
    >
      <View style={{ paddingTop: insets.top }}>
        <RoomHeader {...props} />
      </View>
      <ScrollView contentContainerClassName="pb-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <RoomSessionRail room={props.activeRoom} />
        {props.view === 'people' ? <PeopleView {...props} /> : <FeedView {...props} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// THESIS: The active room is one live set shared by the people who chose to appear.
// OWNED WORLD: A current-moment rail, portrait stickers, venue photography, and chronological notes.
// STORY: Confirm the verified room → see its current moment → meet people or read the room feed.
// FIRST VIEWPORT: Room identity, current moment, live context, and the first useful content stay visible.
// FORM: Relay, quiet, empty, publish-failure, report, and expiry truth remain explicit.
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PortraitImage, VenueImage } from '@/components/night/NightPrimitives';
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

function CurrentMomentRail({ room }: { room: ActiveRoom }) {
  const moments = [
    { label: 'Joined', value: formatMoment(room.joinedAt, 'milliseconds') },
    { label: 'Right now', value: room.about || 'Room live', selected: true },
    { label: 'Ends', value: formatCredentialExpiry(Math.floor(room.leaveAt / 1000)) },
  ];
  return (
    <View
      accessibilityLabel={`Room timing. Joined ${moments[0].value}. Current moment ${moments[1].value}. Ends ${moments[2].value}.`}
      accessible
      className="border-b border-edge bg-surface"
    >
      <View className="flex-row px-4">
        {moments.map((moment) => (
          <View className={`min-h-[66px] flex-1 items-center justify-center px-1 ${moment.selected ? 'bg-primary' : ''}`} key={moment.label}>
            <Text className={`text-[10px] font-black uppercase ${moment.selected ? 'text-white' : 'text-ink'}`}>{moment.label}</Text>
            <Text className={`mt-1 text-center text-[11px] font-semibold ${moment.selected ? 'text-white' : 'text-ink'}`}>{moment.value}</Text>
          </View>
        ))}
      </View>
      <View className="mx-8 -mt-px flex-row items-center">
        <View className="h-px flex-1 bg-primary" />
        <View className="h-3 w-3 rounded-full border-2 border-primary bg-surface" />
        <View className="h-px flex-1 bg-primary" />
        <View className="h-3 w-3 rounded-full border-2 border-primary bg-primary" />
        <View className="h-px flex-1 bg-edge" />
        <View className="h-3 w-3 rounded-full border-2 border-ink bg-surface" />
      </View>
      <View className="h-3" />
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

function Waveform() {
  const bars = [9, 16, 11, 20, 13, 25, 18, 31, 14, 22, 38, 20, 28, 47, 21, 32, 17, 25, 12, 19, 9];
  return (
    <View accessibilityElementsHidden className="h-14 flex-row items-center justify-center gap-1">
      {bars.map((height, index) => <View className="w-0.5 rounded-full bg-primary" key={`${height}-${index}`} style={{ height }} />)}
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
      <View className="px-5 pb-1 pt-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-black uppercase tracking-[0.7px] text-ink">Room moment</Text>
          <Text className="text-xs font-semibold text-muted">Live relay</Text>
        </View>
        <Waveform />
        <Text className="text-center text-base font-bold text-ink">{activeRoom.about}</Text>
      </View>

      <View className="mt-5 flex-row items-end justify-between px-5">
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

      <VenueImage className="mx-5 mt-6 h-44 rounded-t-[28px]" index={1} label={`${activeRoom.name} venue atmosphere`} />
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
  return (
    <SafeAreaView
      className="flex-1 bg-canvas"
      edges={['top', 'left', 'right']}
      testID={props.view === 'people' ? 'room-people-screen' : 'room-feed-screen'}
    >
      <RoomHeader {...props} />
      <ScrollView contentContainerClassName="pb-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CurrentMomentRail room={props.activeRoom} />
        {props.view === 'people' ? <PeopleView {...props} /> : <FeedView {...props} />}
      </ScrollView>
    </SafeAreaView>
  );
}

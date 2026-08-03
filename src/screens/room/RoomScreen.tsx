// THESIS: The active room feels like one shared table, never a popularity ranking.
// OWNED WORLD: People appear as readable coaster-like cards; the feed is one concise room stream.
// STORY: Confirm connection → choose People or Room feed → act within this one venue.
// FIRST VIEWPORT: Connection, room identity, People/feed switch, and first live content are visible.
// FORM: Quiet mode, empty relay data, publish failure, and room expiry remain explicit.
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
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

function ActionPill({ icon, label, onPress, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable className="min-h-12 flex-row items-center gap-2 rounded-full border border-base-300 bg-base-200 px-4" onPress={onPress} testID={testID}>
      <Ionicons color={colors.accent} name={icon} size={18} />
      <Text className="text-sm font-bold text-base-content">{label}</Text>
    </Pressable>
  );
}

function RoomTabs({ onChange, value }: { onChange: (value: RoomView) => void; value: RoomView }) {
  return (
    <View accessibilityRole="tablist" className="mt-5 flex-row rounded-2xl bg-base-200 p-1">
      {(['people', 'feed'] as const).map((tab) => {
        const selected = value === tab;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`min-h-12 flex-1 items-center justify-center rounded-xl ${selected ? 'bg-primary' : ''}`}
            key={tab}
            onPress={() => onChange(tab)}
            testID={`room-${tab}-tab`}
          >
            <Text className={`font-extrabold ${selected ? 'text-white' : 'text-muted'}`}>
              {tab === 'people' ? 'People' : 'Room feed'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function EmptyRoom({ children, icon }: { children: ReactNode; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="mt-7 items-center rounded-[28px] border border-dashed border-base-300 bg-base-200 px-6 py-10">
      <Ionicons color={colors.accent} name={icon} size={34} />
      <Text className="mt-4 max-w-[320px] text-center text-base leading-6 text-muted">{children}</Text>
    </View>
  );
}

function PersonCard({ index, onPress, person }: { index: number; onPress: () => void; person: RoomPerson }) {
  const rotated = index % 2 === 0 ? '-rotate-1' : 'rotate-1';
  return (
    <Pressable
      accessibilityHint="Opens their room profile"
      accessibilityRole="button"
      className={`mb-4 min-h-[148px] w-[48%] justify-between rounded-[30px] border border-base-300 bg-base-200 p-5 ${rotated}`}
      onPress={onPress}
      testID={`person-${person.pubkey}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <Text className="text-lg font-black text-primary">{person.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View className="h-3 w-3 rounded-full bg-success" />
      </View>
      <View>
        <Text numberOfLines={1} className="text-xl font-extrabold text-base-content">{person.name}</Text>
        <Text numberOfLines={1} className="mt-1 text-xs font-bold uppercase tracking-[1px] text-primary">{person.intent}</Text>
        {person.context ? <Text numberOfLines={2} className="mt-2 text-sm leading-5 text-muted">{person.context}</Text> : null}
      </View>
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
      <View className="mt-6 flex-row items-end justify-between">
        <View>
          <Text accessibilityRole="header" className="text-3xl font-black text-base-content">Who’s in the room?</Text>
          <Text className="mt-1 text-sm text-muted">{people.length} visible · no distance or ranking</Text>
        </View>
      </View>
      <View className="mt-5 flex-row flex-wrap justify-between">
        {people.map((person, index) => <PersonCard index={index} key={person.pubkey} onPress={() => onOpenPerson(person.pubkey)} person={person} />)}
      </View>
    </>
  );
}

function FeedView(props: Pick<RoomScreenProps, 'composer' | 'composerError' | 'composerLoading' | 'loading' | 'onChangeComposer' | 'onOpenPerson' | 'onPublish' | 'onReportPost' | 'posts' | 'profiles' | 'reportingPostId' | 'reportNotice'>) {
  return (
    <>
      <Text accessibilityRole="header" className="mt-6 text-3xl font-black text-base-content">Live from this room</Text>
      <Text className="mt-1 text-sm text-muted">This stream locks when you leave.</Text>
      <View className="mt-5 rounded-[24px] border border-base-300 bg-base-200 p-4">
        <TextInput
          accessibilityLabel="Write a room post"
          className="min-h-20 text-base leading-6 text-base-content"
          maxLength={500}
          multiline
          onChangeText={props.onChangeComposer}
          placeholder="Share something useful from this room…"
          placeholderTextColor={colors.placeholder}
          testID="room-post-input"
          value={props.composer}
        />
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xs text-muted">{props.composer.length}/500</Text>
          <Pressable
            accessibilityRole="button"
            className="min-h-12 min-w-24 items-center justify-center rounded-full bg-primary px-5 disabled:opacity-40"
            disabled={props.composerLoading || !props.composer.trim()}
            onPress={props.onPublish}
            testID="publish-room-post"
          >
            {props.composerLoading ? <ActivityIndicator color="white" /> : <Text className="font-extrabold text-white">Post</Text>}
          </Pressable>
        </View>
      </View>
      {props.composerError ? <Text accessibilityRole="alert" className="mt-3 text-sm font-semibold text-error">{props.composerError}</Text> : null}
      {props.reportNotice ? <Text accessibilityRole="alert" className="mt-3 text-sm font-semibold text-muted">{props.reportNotice}</Text> : null}
      {props.loading ? <ActivityIndicator className="mt-10" color={colors.primary} /> : null}
      {!props.loading && !props.posts.length ? <EmptyRoom icon="chatbubble-ellipses-outline">No room posts yet. Venue announcements and guest posts will appear here.</EmptyRoom> : null}
      <View className="mt-5 gap-4">
        {props.posts.map((post) => {
          const profile = props.profiles.get(post.pubkey);
          return (
            <View className={`rounded-[24px] border p-5 ${post.announcement ? 'border-primary/40 bg-primary/10' : 'border-base-300 bg-base-200'}`} key={post.id} testID={`post-${post.id}`}>
              <View className="flex-row items-center justify-between">
                <Pressable onPress={() => props.onOpenPerson(post.pubkey)}>
                  <Text className="font-extrabold text-base-content">{profile?.name || 'Room guest'}</Text>
                </Pressable>
                {post.announcement ? <Text className="text-xs font-black uppercase tracking-[1px] text-primary">Announcement</Text> : null}
              </View>
              <Text className="mt-3 text-base leading-6 text-base-content">{post.content}</Text>
              <View className="mt-4 flex-row gap-5">
                <Pressable onPress={() => props.onOpenPerson(post.pubkey)}><Text className="text-sm font-bold text-primary">Message</Text></Pressable>
                <Pressable accessibilityLabel={`Report post by ${profile?.name || 'room guest'}`} disabled={props.reportingPostId === post.id} onPress={() => props.onReportPost(post)} testID={`report-post-${post.id}`}><Text className="text-sm font-bold text-muted">{props.reportingPostId === post.id ? 'Reporting…' : 'Report'}</Text></Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

export function RoomScreen(props: RoomScreenProps) {
  return (
    <AppShell eyebrow="Connected in the room" testID={props.view === 'people' ? 'room-people-screen' : 'room-feed-screen'} title={props.activeRoom.name}>
      <View className="mt-1 flex-row items-center gap-2">
        <View className={`h-2.5 w-2.5 rounded-full ${props.connected ? 'bg-success' : 'bg-muted'}`} />
        <Text className="text-sm font-semibold text-muted">{props.connected ? 'Relay connected' : 'Connecting to this room…'}</Text>
      </View>
      <View className="mt-4 flex-row flex-wrap gap-2">
        <ActionPill icon="restaurant-outline" label="Menu" onPress={props.onMenu} testID="room-menu" />
        <ActionPill icon="ticket-outline" label="My night" onPress={props.onMyNight} testID="room-my-night" />
        <ActionPill icon="exit-outline" label="Leave" onPress={props.onLeave} testID="room-leave" />
      </View>
      <RoomTabs onChange={props.onChangeView} value={props.view} />
      {props.view === 'people' ? <PeopleView {...props} /> : <FeedView {...props} />}
    </AppShell>
  );
}

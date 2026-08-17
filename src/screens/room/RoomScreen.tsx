// THESIS: The active room is one verified place shared by the people who chose to appear.
// OWNED WORLD: Session timing, portrait stickers, and chronological notes.
// STORY: Confirm the verified room → see opted-in people or read the room feed.
// FIRST VIEWPORT: Room identity, session boundary, connection truth, and useful content stay visible.
// FORM: Relay, quiet, empty, publish-failure, report, and expiry truth remain explicit.
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PortraitImage } from '@/components/night/NightPrimitives';
import { MenuCatalog, MenuCartButton } from '@/screens/commerce/MenuScreen';
import type { ActiveRoom, RoomPerson, RoomPost, RoomProduct, RoomProfile } from '@/rooms/types';
import { colors } from '@/theme/colors';

export type RoomView = 'menu' | 'people' | 'feed';

type RoomScreenProps = {
  activeRoom: ActiveRoom;
  connected: boolean;
  loading: boolean;
  cartCount: number;
  people: RoomPerson[];
  posts: RoomPost[];
  products: RoomProduct[];
  profiles: ReadonlyMap<string, RoomProfile>;
  view: RoomView;
  composer: string;
  composerError?: string | null;
  composerLoading?: boolean;
  onChangeComposer: (value: string) => void;
  onChangeView: (view: RoomView) => void;
  onCart: () => void;
  onLeave: () => void;
  onMyNight: () => void;
  onOpenProduct: (product: RoomProduct) => void;
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

function RoomHeader(props: Pick<RoomScreenProps, 'activeRoom' | 'connected' | 'loading' | 'onChangeView' | 'onLeave' | 'onMyNight' | 'people' | 'view'>) {
  const peopleCount = props.loading ? '…' : String(props.people.length);
  const tabs: { label: string; accessibilityLabel: string; value: RoomView }[] = [
    { label: 'Menu', accessibilityLabel: 'Menu', value: 'menu' },
    { label: `People (${peopleCount})`, accessibilityLabel: props.loading ? 'People, loading visible count' : `People, ${peopleCount} visible`, value: 'people' },
    { label: 'Feed', accessibilityLabel: 'Room feed', value: 'feed' },
  ];
  return (
    <View className="border-b border-edge bg-surface-soft pb-3 pt-2">
      <View className="mx-auto w-full max-w-[620px] flex-row items-start justify-between gap-3 px-5">
        <HeaderButton icon="chevron-down" label="Leave room" onPress={props.onLeave} testID="room-leave" />
        <View className="min-w-0 flex-1 pt-1">
          <Text accessibilityRole="header" className="text-[24px] font-black uppercase leading-7 tracking-[-0.7px] text-primary">
            {props.activeRoom.name}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-1.5">
            <View className={`h-2 w-2 rounded-full ${props.connected ? 'bg-success' : 'bg-attention'}`} />
            <Text className="text-xs font-semibold text-muted">
              {props.connected ? 'Connected in the room' : 'Connecting to this room…'}
            </Text>
          </View>
        </View>
        <HeaderButton icon="ticket-outline" label="Open My night" onPress={props.onMyNight} testID="room-my-night" />
      </View>
      <View accessibilityRole="tablist" className="mx-auto mt-3 w-full max-w-[620px] flex-row gap-1 px-5">
        {tabs.map((tab) => {
          const selected = props.view === tab.value;
          return (
            <Pressable
              accessibilityLabel={tab.accessibilityLabel}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              className={`min-h-12 flex-1 items-center justify-center rounded-xl px-2 ${selected ? 'bg-primary' : 'bg-surface'}`}
              key={tab.value}
              onPress={() => props.onChangeView(tab.value)}
              testID={`room-${tab.value === 'menu' ? 'menu' : `${tab.value}-tab`}`}
            >
              <Text className={`text-center text-xs font-black uppercase ${selected ? 'text-white' : 'text-muted'}`}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
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
      <View className="mx-auto w-full max-w-[620px] flex-row px-5">
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

export function getPeopleRosterLayout(viewportWidth: number, fontScale: number) {
  const contentWidth = Math.max(0, Math.min(viewportWidth, 620) - 40);
  const largeText = fontScale >= 1.3;
  const columns = largeText
    ? contentWidth >= 520 ? 4 : 2
    : contentWidth >= 520 ? 5 : contentWidth >= 400 ? 4 : contentWidth >= 270 ? 3 : 2;
  const gap = 12;

  return {
    cardWidth: Math.max(0, (contentWidth - gap * (columns - 1)) / columns),
    columns,
    gap,
  };
}

function PersonCard({ cardWidth, onPress, person }: { cardWidth: number; onPress: () => void; person: RoomPerson }) {
  return (
    <Pressable
      accessibilityHint="Opens their room profile"
      accessibilityLabel={`${person.name}, ${person.intent}${person.context ? `, ${person.context}` : ''}`}
      accessibilityRole="button"
      className="min-h-[156px] active:opacity-75"
      onPress={onPress}
      style={{ width: cardWidth }}
      testID={`person-${person.pubkey}`}
    >
      <PortraitImage
        className="w-full rounded-[26px]"
        identity={person.pubkey}
        label={`Profile image for ${person.name}`}
        picture={person.picture}
        style={{ aspectRatio: 92 / 104 }}
        testID={`person-image-${person.pubkey}`}
      />
      <Text className="mt-2 text-[15px] font-black uppercase leading-5 text-ink">{person.name}</Text>
      <Text className="mt-0.5 text-[10px] font-black uppercase leading-4 tracking-[0.4px] text-primary">{person.intent}</Text>
    </Pressable>
  );
}

function PeopleView({ activeRoom, loading, onOpenPerson, people }: Pick<RoomScreenProps, 'activeRoom' | 'loading' | 'onOpenPerson' | 'people'>) {
  const { fontScale, width } = useWindowDimensions();
  const roster = getPeopleRosterLayout(width, fontScale);

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
      <View className="mx-auto mt-6 w-full max-w-[620px] flex-row flex-wrap items-end justify-between gap-2 px-5">
        <Text accessibilityRole="header" className="text-xs font-black uppercase tracking-[0.7px] text-ink">People here · {people.length} visible</Text>
        <Text className="text-[11px] text-muted">No distance or ranking</Text>
      </View>
      <View
        className="mx-auto mt-4 w-full max-w-[620px] flex-row flex-wrap gap-3 px-5 pb-8"
        testID="people-roster"
      >
        {people.map((person) => (
          <PersonCard
            cardWidth={roster.cardWidth}
            key={person.pubkey}
            onPress={() => onOpenPerson(person.pubkey)}
            person={person}
          />
        ))}
      </View>
    </>
  );
}

function FeedPost({
  onOpenPerson,
  onReportPost,
  post,
  profile,
  reporting,
}: {
  onOpenPerson: () => void;
  onReportPost: () => void;
  post: RoomPost;
  profile?: RoomProfile;
  reporting: boolean;
}) {
  const authorName = profile?.name || (post.announcement ? 'The room' : 'Room guest');
  return (
    <View
      className={`mb-3 rounded-2xl border p-4 ${post.announcement ? 'border-primary/25 bg-surface-soft' : 'border-edge bg-surface'}`}
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
          <Text className="mt-1 text-base leading-6 text-ink">{post.content}</Text>
          <View className="mt-2 flex-row items-center gap-5">
            <Pressable
              accessibilityLabel={`Message ${authorName}`}
              accessibilityRole="button"
              className="min-h-12 flex-row items-center gap-1.5 pr-2"
              onPress={onOpenPerson}
              testID={`message-post-${post.id}`}
            >
              <Ionicons color={colors.primary} name="chatbubble-outline" size={17} />
              <Text className="text-xs font-black text-primary">Message</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Report post by ${authorName}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: reporting }}
              className="min-h-12 flex-row items-center gap-1.5 px-2"
              disabled={reporting}
              onPress={onReportPost}
              testID={`report-post-${post.id}`}
            >
              <Ionicons color={colors.inkMuted} name="flag-outline" size={17} />
              <Text className="text-xs font-bold text-muted">{reporting ? 'Reporting…' : 'Report'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function FeedView(props: Pick<RoomScreenProps, 'composer' | 'composerError' | 'composerLoading' | 'loading' | 'onChangeComposer' | 'onOpenPerson' | 'onPublish' | 'onReportPost' | 'posts' | 'profiles' | 'reportingPostId' | 'reportNotice'>) {
  return (
    <View className="mx-auto w-full max-w-[620px] px-5 pb-8 pt-5">
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

      <View className="mt-5">
        {props.posts.map((post) => (
          <FeedPost
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
      testID={`room-${props.view}-screen`}
    >
      <ScrollView
        key={props.view}
        contentContainerClassName="pb-6"
        contentContainerStyle={{ paddingTop: insets.top }}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ top: insets.top, bottom: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <RoomHeader {...props} />
        <RoomSessionRail room={props.activeRoom} />
        {props.view === 'menu' ? (
          <View className="mx-auto w-full max-w-[620px] px-5">
            <MenuCatalog
              cartAction={<MenuCartButton cartCount={props.cartCount} onCart={props.onCart} />}
              loading={props.loading}
              onOpenProduct={props.onOpenProduct}
              products={props.products}
              roomName={props.activeRoom.name}
              testID="menu-screen"
            />
          </View>
        ) : null}
        {props.view === 'people' ? <PeopleView {...props} /> : null}
        {props.view === 'feed' ? <FeedView {...props} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

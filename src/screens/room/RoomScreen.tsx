// THESIS: The active room is one verified place shared by the people who chose to appear.
// OWNED WORLD: Session timing, portrait stickers, and chronological notes.
// STORY: Confirm the verified room → see opted-in people or read the room feed.
// FIRST VIEWPORT: Room identity, session boundary, connection truth, and useful content stay visible.
// FORM: Relay, quiet, empty, publish-failure, report, and expiry truth remain explicit.
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PortraitImage } from '@/components/night/NightPrimitives';
import { MenuCatalog, MenuCartButton } from '@/screens/commerce/MenuScreen';
import { roomFeedRoots, roomPostEngagement } from '@/rooms/feed';
import type { ActiveRoom, RoomOrder, RoomPerson, RoomPost, RoomProduct, RoomProfile, RoomReaction } from '@/rooms/types';
import { orderSummaryLabel } from '@/screens/durable/NightAndOrderScreens';
import { RoomNoteCard } from '@/screens/room/RoomNoteCard';
import { colors } from '@/theme/colors';

export type RoomView = 'menu' | 'people' | 'feed';

type RoomScreenProps = {
  activeRoom: ActiveRoom;
  activeOrder?: RoomOrder;
  connected: boolean;
  loading: boolean;
  cartCount: number;
  people: RoomPerson[];
  posts: RoomPost[];
  products: RoomProduct[];
  profiles: ReadonlyMap<string, RoomProfile>;
  reactions: RoomReaction[];
  viewerPubkey?: string | null;
  view: RoomView;
  onChangeView: (view: RoomView) => void;
  onCart: () => void;
  onBecomeVisible?: () => void;
  onLeave: () => void;
  onMyNight: () => void;
  onOpenOrder?: () => void;
  onOpenProduct: (product: RoomProduct) => void;
  onOpenPerson: (pubkey: string) => void;
  onOpenPersonProfile?: (pubkey: string) => void;
  onComposePost: () => void;
  onLikePost: (post: RoomPost) => void;
  onOpenThread: (post: RoomPost) => void;
  onReplyPost: (post: RoomPost) => void;
  onReportPost: (post: RoomPost) => void;
  likedPostIds?: ReadonlySet<string>;
  likingPostId?: string | null;
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

function LeaveButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" className="min-h-12 flex-row items-center gap-1 px-2" onPress={onPress} testID="room-leave">
      <Ionicons color={colors.commitment} name="exit-outline" size={20} />
      <Text className="font-black text-commitment">Leave</Text>
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
        <LeaveButton onPress={props.onLeave} />
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

function LiveNightRail({ activeOrder, onBecomeVisible, onOpenOrder, room }: Pick<RoomScreenProps, 'activeOrder' | 'onBecomeVisible' | 'onOpenOrder'> & { room: ActiveRoom }) {
  return (
    <View className="mx-auto w-full max-w-[620px] px-5 pt-4">
      {activeOrder ? (
        <Pressable
          accessibilityLabel={`${activeOrder.product.name}. ${orderSummaryLabel(activeOrder)}. Open order`}
          accessibilityRole="button"
          className="min-h-16 flex-row items-center rounded-2xl bg-attention px-4 py-3 active:opacity-80"
          onPress={onOpenOrder}
          testID="tonight-active-order"
        >
          <Ionicons color={colors.ink} name={activeOrder.status === 'ready' ? 'notifications' : 'receipt-outline'} size={23} />
          <View className="ml-3 min-w-0 flex-1">
            <Text className="font-black text-ink">{activeOrder.status === 'ready' ? 'Your order is ready' : orderSummaryLabel(activeOrder)}</Text>
            <Text className="mt-0.5 text-sm text-ink">{activeOrder.product.name}</Text>
          </View>
          <Ionicons color={colors.ink} name="chevron-forward" size={20} />
        </Pressable>
      ) : null}
      {room.visibility === 'quiet' ? (
        <View className="mt-3 flex-row items-start rounded-2xl border border-edge bg-surface px-4 py-3" testID="quiet-presence-banner">
          <Ionicons color={colors.ink} name="eye-off-outline" size={22} />
          <View className="ml-3 min-w-0 flex-1">
            <Text className="font-black text-ink">You’re browsing quietly</Text>
            <Text className="mt-0.5 text-sm leading-5 text-muted">No presence was published. Visible people can’t see you here.</Text>
            <Pressable accessibilityRole="button" className="-ml-2 mt-2 min-h-12 self-start justify-center px-2" onPress={onBecomeVisible} testID="become-visible">
              <Text className="font-black text-primary">Become visible</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
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

function PersonCard({ cardWidth, onPress, onProfile, person }: { cardWidth: number; onPress: () => void; onProfile?: () => void; person: RoomPerson }) {
  return (
    <View className="min-h-[156px]" style={{ width: cardWidth }}>
      <Pressable
        accessibilityHint="Opens a message request"
        accessibilityLabel={`${person.name}, ${person.intent}${person.context ? `, ${person.context}` : ''}`}
        accessibilityRole="button"
        className="active:opacity-75"
        onPress={onPress}
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
      {onProfile ? (
        <Pressable
          accessibilityLabel={`Open ${person.name} profile and safety actions`}
          accessibilityRole="button"
          className="absolute right-2 top-2 h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-photo-night/70"
          hitSlop={4}
          onPress={onProfile}
          testID={`person-profile-${person.pubkey}`}
        >
          <Ionicons color={colors.surface} name="ellipsis-horizontal" size={21} />
        </Pressable>
      ) : null}
    </View>
  );
}

function PeopleView({ activeRoom, loading, onOpenPerson, onOpenPersonProfile, people }: Pick<RoomScreenProps, 'activeRoom' | 'loading' | 'onOpenPerson' | 'onOpenPersonProfile' | 'people'>) {
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
            onProfile={onOpenPersonProfile ? () => onOpenPersonProfile(person.pubkey) : undefined}
            person={person}
          />
        ))}
      </View>
    </>
  );
}

function FeedView(props: Pick<RoomScreenProps, 'likedPostIds' | 'likingPostId' | 'loading' | 'onComposePost' | 'onLikePost' | 'onOpenPerson' | 'onOpenThread' | 'onReplyPost' | 'onReportPost' | 'posts' | 'profiles' | 'reactions' | 'reportingPostId' | 'reportNotice' | 'viewerPubkey'>) {
  const roots = roomFeedRoots(props.posts);
  return (
    <View className="mx-auto w-full max-w-[620px] px-5 pb-8 pt-5">
      <View className="flex-row items-end justify-between">
        <View>
          <Text accessibilityRole="header" className="text-xs font-black uppercase tracking-[0.7px] text-ink">Room feed</Text>
          <Text className="mt-1 text-sm text-muted">Chronological · locks when you leave</Text>
        </View>
      </View>

      {props.reportNotice ? <Text accessibilityRole="alert" className="mt-3 text-sm font-semibold text-muted">{props.reportNotice}</Text> : null}
      <Pressable
        accessibilityLabel="Create a room post"
        accessibilityRole="button"
        className="mt-5 min-h-14 flex-row items-center justify-between rounded-2xl border-2 border-primary bg-surface px-4 active:bg-surface-soft"
        onPress={props.onComposePost}
        testID="open-room-post-composer"
      >
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Ionicons color={colors.surface} name="create-outline" size={21} />
          </View>
          <View>
            <Text className="text-base font-black text-ink">Post to this room</Text>
            <Text className="text-xs text-muted">Write a note or share a photo</Text>
          </View>
        </View>
        <Ionicons color={colors.primary} name="arrow-forward" size={20} />
      </Pressable>
      {props.loading ? <ActivityIndicator className="mt-10" color={colors.primary} /> : null}
      {!props.loading && !roots.length ? <EmptyRoom icon="chatbubble-ellipses-outline">No room posts yet. Start the conversation or share the room.</EmptyRoom> : null}

      <View className="mt-5">
        {roots.map((post) => {
          const engagement = roomPostEngagement(post, props.posts, props.reactions, props.viewerPubkey);
          const optimisticLiked = props.likedPostIds?.has(post.id) && !engagement.likedByViewer;
          return (
            <RoomNoteCard
              key={post.id}
              liked={engagement.likedByViewer || Boolean(optimisticLiked)}
              likeCount={engagement.likeCount + (optimisticLiked ? 1 : 0)}
              liking={props.likingPostId === post.id}
              onLike={() => props.onLikePost(post)}
              onMessage={() => props.onOpenPerson(post.pubkey)}
              onOpenPerson={() => props.onOpenPerson(post.pubkey)}
              onOpenThread={() => props.onOpenThread(post)}
              onReply={() => props.onReplyPost(post)}
              onReport={() => props.onReportPost(post)}
              post={post}
              profile={props.profiles.get(post.pubkey)}
              replyCount={engagement.replyCount}
              reporting={props.reportingPostId === post.id}
            />
          );
        })}
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
        <LiveNightRail activeOrder={props.activeOrder} onBecomeVisible={props.onBecomeVisible} onOpenOrder={props.onOpenOrder} room={props.activeRoom} />
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

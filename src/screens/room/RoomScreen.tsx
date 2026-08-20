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
  onInviteFriend: () => void;
  onLeave: () => void;
  onOpenOrder?: () => void;
  onOpenProduct: (product: RoomProduct) => void;
  onOpenPerson: (pubkey: string) => void;
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

function formatCredentialExpiry(epochMilliseconds: number) {
  if (!epochMilliseconds || !Number.isFinite(epochMilliseconds)) return '—';
  const expiry = new Date(epochMilliseconds);
  const time = expiry.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (expiry.toDateString() === new Date().toDateString()) return time;
  const date = expiry.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return `${date} · ${time}`;
}

function LeaveButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" className="min-h-12 items-center justify-center px-2" onPress={onPress} testID="room-leave">
      <Text className="font-bold text-primary">Leave</Text>
    </Pressable>
  );
}

function RoomTabs(props: Pick<RoomScreenProps, 'loading' | 'onChangeView' | 'people' | 'view'>) {
  const peopleCount = props.loading ? 'loading' : `${props.people.length} visible`;
  const tabs: { label: string; accessibilityLabel: string; value: RoomView }[] = [
    { label: 'People', accessibilityLabel: `People, ${peopleCount}`, value: 'people' },
    { label: 'Menu', accessibilityLabel: 'Menu', value: 'menu' },
    { label: 'Feed', accessibilityLabel: 'Room feed', value: 'feed' },
  ];
  return (
    <View accessibilityRole="tablist" className="mx-auto w-full max-w-[620px] flex-row border-b border-edge px-5" testID="room-tabs">
      {tabs.map((tab) => {
        const selected = props.view === tab.value;
        return (
          <Pressable
            accessibilityLabel={tab.accessibilityLabel}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`min-h-12 flex-1 items-center justify-center border-b-2 px-2 ${selected ? 'border-primary' : 'border-transparent'}`}
            key={tab.value}
            onPress={() => props.onChangeView(tab.value)}
            testID={`room-${tab.value === 'menu' ? 'menu' : `${tab.value}-tab`}`}
          >
            <Text className={`text-center text-sm font-bold ${selected ? 'text-primary' : 'text-muted'}`}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RoomHeader(props: Pick<RoomScreenProps, 'activeRoom' | 'connected' | 'onLeave'>) {
  return (
    <View className="bg-surface">
      <View className="mx-auto w-full max-w-[620px] flex-row items-center justify-between gap-3 px-5">
        <View className="min-w-0 flex-1">
          <Text accessibilityRole="header" className="text-[20px] font-black leading-6 tracking-[-0.4px] text-ink">
            {props.activeRoom.name}
          </Text>
        </View>
        <LeaveButton onPress={props.onLeave} />
      </View>
      <RoomStatusRail connected={props.connected} room={props.activeRoom} />
    </View>
  );
}

function RoomStatusRail({ connected, room }: { connected: boolean; room: ActiveRoom }) {
  const status = connected ? 'Connected' : 'Connecting…';
  const leaving = formatCredentialExpiry(room.leaveAt);
  return (
    <View
      accessibilityLabel={`Room status. ${status}. Leaving by ${leaving}.`}
      accessible
      className="mx-auto w-full max-w-[620px] px-5"
      testID="room-status"
    >
      <View className="min-h-10 flex-row items-center justify-between rounded-lg border border-edge bg-surface px-3">
        <View className="flex-row items-center gap-2">
          <View className={`h-2 w-2 rounded-full ${connected ? 'bg-success' : 'bg-attention'}`} />
          <Text className="text-xs font-semibold text-muted">{status}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs text-muted">Leaving by {leaving}</Text>
          <Ionicons accessibilityElementsHidden color={colors.inkMuted} importantForAccessibility="no-hide-descendants" name="information-circle-outline" size={16} />
        </View>
      </View>
    </View>
  );
}

function ActiveOrderRail({ activeOrder, onOpenOrder }: Pick<RoomScreenProps, 'activeOrder' | 'onOpenOrder'>) {
  if (!activeOrder) return null;
  return (
    <View className="mx-auto w-full max-w-[620px] px-5 pt-3">
      <Pressable
        accessibilityLabel={`${activeOrder.product.name}. ${orderSummaryLabel(activeOrder)}. Open order`}
        accessibilityRole="button"
        className="min-h-14 flex-row items-center rounded-xl bg-attention px-4 py-2 active:opacity-80"
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
    </View>
  );
}

function QuietPresenceRail({ onBecomeVisible, room }: Pick<RoomScreenProps, 'onBecomeVisible'> & { room: ActiveRoom }) {
  if (room.visibility !== 'quiet') return null;
  return (
    <View className="mx-auto min-h-12 w-full max-w-[620px] flex-row flex-wrap items-center gap-1.5 px-5" testID="quiet-presence-banner">
      <View className="h-2 w-2 rounded-full bg-success" />
      <Text className="text-xs text-muted">Browsing quietly ·</Text>
      <Pressable accessibilityRole="button" className="min-h-12 justify-center px-0.5" onPress={onBecomeVisible} testID="become-visible">
        <Text className="text-xs font-bold text-primary">Become visible</Text>
      </Pressable>
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
    ? contentWidth >= 520 ? 4 : contentWidth >= 340 ? 3 : 2
    : contentWidth >= 520 ? 5 : contentWidth >= 260 ? 4 : 3;
  const gap = 8;

  return {
    cardWidth: Math.max(0, (contentWidth - gap * (columns - 1)) / columns),
    columns,
    gap,
  };
}

function PersonCard({ cardWidth, onPress, person }: { cardWidth: number; onPress: () => void; person: RoomPerson }) {
  return (
    <Pressable
      accessibilityHint="Opens a message request sheet"
      accessibilityLabel={`${person.name}, ${person.intent}${person.context ? `, ${person.context}` : ''}`}
      accessibilityRole="button"
      className="min-h-[112px] active:opacity-75"
      onPress={onPress}
      style={{ width: cardWidth }}
      testID={`person-${person.pubkey}`}
    >
      <PortraitImage
        className="w-full rounded-xl"
        identity={person.pubkey}
        label={`Profile image for ${person.name}`}
        picture={person.picture}
        style={{ aspectRatio: 92 / 104 }}
        testID={`person-image-${person.pubkey}`}
      />
      <Text className="mt-1.5 text-sm font-bold leading-5 text-ink">{person.name}</Text>
    </Pressable>
  );
}

function PeopleView({ activeRoom, loading, onInviteFriend, onOpenPerson, people }: Pick<RoomScreenProps, 'activeRoom' | 'loading' | 'onInviteFriend' | 'onOpenPerson' | 'people'>) {
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
      <View className="mx-auto mt-1 w-full max-w-[620px] px-5">
        <Text accessibilityRole="header" className="text-sm font-bold text-ink">People here ({people.length})</Text>
      </View>
      <View
        className="mx-auto mt-3 w-full max-w-[620px] flex-row flex-wrap px-5"
        style={{ gap: roster.gap }}
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
      <View className="mx-auto mt-2 w-full max-w-[620px] px-5 pb-8">
        <Text className="mb-3 text-sm font-bold text-ink">Say hello to someone new</Text>
        <Pressable
          accessibilityLabel="Invite a friend, share a room link"
          accessibilityRole="button"
          className="min-h-16 flex-row items-center rounded-xl border border-edge bg-surface px-3 active:bg-surface-soft"
          onPress={onInviteFriend}
          testID="invite-friend"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-soft">
            <Ionicons color={colors.ink} name="person-add-outline" size={21} />
          </View>
          <View className="ml-3 min-w-0 flex-1">
            <Text className="font-bold text-ink">Invite a friend</Text>
            <Text className="mt-0.5 text-xs text-muted">Share a link</Text>
          </View>
          <Ionicons color={colors.ink} name="chevron-forward" size={20} />
        </Pressable>
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
        <ActiveOrderRail activeOrder={props.activeOrder} onOpenOrder={props.onOpenOrder} />
        <RoomTabs {...props} />
        <QuietPresenceRail onBecomeVisible={props.onBecomeVisible} room={props.activeRoom} />
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

// THESIS: Tonight's actionable objects are surfaced together, while durable history stays in Me.
// OWNED WORLD: Credentials and orders read as physical tickets laid on a dark table.
// STORY: Scan urgent credential → track live order → inspect its venue-authoritative detail.
// FIRST VIEWPORT: Current room, ready status, and the next useful action are visible.
// FORM: Empty, loading, cancelled, fulfilled, offline, and deferred-payment states stay textual.
import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppShell, RaisedRow, SectionTitle } from '@/components/app/AppShell';
import { DrinkImage, NightBadge, NightCard } from '@/components/night/NightPrimitives';
import { ErrorBanner, PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import { formatCurrency } from '@/commerce/currency';
import type { MyNightDoorItem } from '@/screens/durable/myNight';
import type { RoomMembershipOffer, RoomOrder } from '@/rooms/types';
import { colors } from '@/theme/colors';

export const orderStatusLabel = (status: RoomOrder['status']) => ({
  pending: 'Sent',
  accepted: 'Accepted',
  processing: 'Preparing',
  ready: 'Ready',
  fulfilled: 'Served',
  cancelled: 'Cancelled',
})[status];

export const orderSummaryLabel = (order: Pick<RoomOrder, 'status'>) => ({
  pending: 'Order received',
  accepted: 'Order accepted',
  processing: 'Being prepared',
  ready: 'Ready for pickup',
  fulfilled: 'Served',
  cancelled: 'Cancelled',
})[order.status];

const ORDER_STEPS: RoomOrder['status'][] = ['pending', 'accepted', 'processing', 'ready', 'fulfilled'];

function StatusPill({ status }: { status: RoomOrder['status'] }) {
  const tone = status === 'cancelled' ? 'error' : status === 'ready' || status === 'fulfilled' ? 'verified' : 'primary';
  return <NightBadge tone={tone}>{orderStatusLabel(status)}</NightBadge>;
}

function StatusMotion({ children, status }: PropsWithChildren<{ status: RoomOrder['status'] }>) {
  const opacity = useSharedValue(1);
  const previousStatus = useRef(status);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (previousStatus.current === status) return;
    previousStatus.current = status;
    if (reduceMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = 0.45;
    opacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [opacity, reduceMotion, status]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

function CompactOrderRail({ status }: { status: RoomOrder['status'] }) {
  const current = ORDER_STEPS.indexOf(status);
  return (
    <StatusMotion status={status}>
      <View
        accessibilityLabel={`Order progress: ${orderSummaryLabel({ status })}`}
        accessible
        className="mt-4 flex-row items-center"
      >
        {ORDER_STEPS.map((step, index) => (
          <View className={`flex-row items-center ${index === ORDER_STEPS.length - 1 ? '' : 'flex-1'}`} key={step}>
            <View
              className={`h-2.5 w-2.5 rounded-full ${status === 'cancelled' ? 'bg-edge' : index <= current ? 'bg-primary' : 'bg-edge'}`}
            />
            {index < ORDER_STEPS.length - 1 ? (
              <View className={`h-0.5 flex-1 ${status !== 'cancelled' && index < current ? 'bg-primary' : 'bg-edge'}`} />
            ) : null}
          </View>
        ))}
      </View>
    </StatusMotion>
  );
}

function OrderTimeline({ status }: { status: RoomOrder['status'] }) {
  if (status === 'cancelled') {
    return (
      <StatusMotion status={status}>
        <View className="rounded-2xl border border-error/25 bg-error/10 p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-error">
              <Ionicons color={colors.surface} name="close" size={20} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-black text-error">Cancelled</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">This order will not move to pickup.</Text>
            </View>
          </View>
        </View>
      </StatusMotion>
    );
  }

  const current = ORDER_STEPS.indexOf(status);
  return (
    <StatusMotion status={status}>
      <View accessibilityLabel={`Current order status: ${orderStatusLabel(status)}`} accessible>
        {ORDER_STEPS.map((step, index) => {
          const complete = index < current;
          const selected = index === current;
          return (
            <View className="min-h-14 flex-row" key={step}>
              <View className="w-9 items-center">
                <View className={`h-7 w-7 items-center justify-center rounded-full ${complete ? 'bg-verified' : selected ? 'bg-primary' : 'border-2 border-edge bg-surface'}`}>
                  {complete ? <Ionicons color={colors.ink} name="checkmark" size={16} /> : selected ? <View className="h-2.5 w-2.5 rounded-full bg-surface" /> : null}
                </View>
                {index < ORDER_STEPS.length - 1 ? <View className={`w-0.5 flex-1 ${complete ? 'bg-verified' : 'bg-edge'}`} /> : null}
              </View>
              <View className="ml-3 pb-4 pt-1">
                <Text className={`font-black ${selected ? 'text-primary' : complete ? 'text-ink' : 'text-ink-muted'}`}>{orderStatusLabel(step)}</Text>
                {selected ? <Text className="mt-0.5 text-xs font-semibold text-muted">Current status</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </StatusMotion>
  );
}

export function sortOrdersForDisplay(orders: RoomOrder[]) {
  return [...orders].sort((left, right) => right.updatedAt - left.updatedAt || left.id.localeCompare(right.id));
}

export function groupOrdersByLocalDate(orders: RoomOrder[]) {
  const groups = new Map<string, { key: string; label: string; orders: RoomOrder[] }>();
  for (const order of sortOrdersForDisplay(orders)) {
    const date = new Date(order.updatedAt * 1000);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.orders.push(order);
      continue;
    }
    groups.set(key, {
      key,
      label: date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
      orders: [order],
    });
  }
  return [...groups.values()];
}

export function orderVenueName(order?: Pick<RoomOrder, 'roomName'>, activeRoomName?: string) {
  return order?.roomName || activeRoomName || 'Venue';
}

function formatOrderTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
}

function formatOrderClock(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function doorItemCopy(item: MyNightDoorItem) {
  if (item.kind === 'credential') return { action: 'Live code ready', icon: 'qr-code-outline' as const, section: 'Ready at the door' };
  if (item.kind === 'rsvp') return { action: 'RSVP saved', icon: 'ticket-outline' as const, section: 'Your next event' };
  return { action: 'View event', icon: 'calendar-outline' as const, section: 'Coming up' };
}

export function MyNightScreen({ doorItem, membership, onBack, onDoorItem, onMembership, onOrder, order, roomName }: { doorItem?: MyNightDoorItem; membership?: RoomMembershipOffer; onBack: () => void; onDoorItem: () => void; onMembership: () => void; onOrder: () => void; order?: RoomOrder; roomName: string }) {
  const copy = doorItem ? doorItemCopy(doorItem) : undefined;
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'right', 'left']} testID="my-night-screen">
      <ScrollView contentContainerClassName="grow" contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} scrollIndicatorInsets={{ bottom: insets.bottom }} showsVerticalScrollIndicator={false}>
        <View className="relative h-64 overflow-hidden bg-photo-night">
          <View accessibilityElementsHidden className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-primary/30" />
          <View accessibilityElementsHidden className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-verified/20" />
          <View accessibilityElementsHidden className="absolute bottom-8 right-8 h-px w-40 -rotate-12 bg-white/30" />
          <Pressable accessibilityLabel="Back to room" accessibilityRole="button" className="absolute left-4 top-3 min-h-12 min-w-12 items-center justify-center rounded-full bg-surface/95" hitSlop={8} onPress={onBack} testID="my-night-back">
            <Ionicons color={colors.ink} name="chevron-back" size={24} />
          </Pressable>
          <View className="absolute bottom-14 left-5 right-5">
            <Text accessibilityRole="header" className="text-[30px] font-black uppercase tracking-[0.4px] text-white">My night</Text>
            <Text className="mt-1 text-base font-semibold text-white">{roomName}</Text>
          </View>
        </View>

        <View className="-mt-10 px-5">
          {!doorItem && !membership && !order ? (
            <View className="items-center rounded-2xl border border-dashed border-edge bg-surface p-8">
              <Ionicons color={colors.primary} name="moon-outline" size={36} />
              <Text className="mt-4 text-xl font-black text-ink">Nothing needs you right now</Text>
              <Text className="mt-2 text-center leading-6 text-muted">Tickets, ready orders, and usable benefits from this room appear here.</Text>
            </View>
          ) : null}

          {doorItem && copy ? (
            <View className="rounded-2xl border border-edge bg-surface p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-[11px] font-black uppercase tracking-[0.7px] text-ink">{copy.section}</Text>
                  <Text className="mt-1 text-lg font-black text-ink">{doorItem.title}</Text>
                  <Text className="mt-1 text-sm text-muted">{doorItem.location} · {copy.action}</Text>
                </View>
                {doorItem.kind === 'credential' ? <NightBadge tone="verified">Valid</NightBadge> : null}
              </View>
              <View className={`my-4 items-center justify-center rounded-xl py-5 ${doorItem.kind === 'credential' ? 'bg-white' : 'bg-surface-soft'}`}>
                <Ionicons color={doorItem.kind === 'event' ? colors.primary : colors.night} name={copy.icon} size={doorItem.kind === 'credential' ? 96 : 54} />
              </View>
              <PrimaryButton label={doorItem.kind === 'credential' ? 'Show at the door' : copy.action} onPress={onDoorItem} testID="my-night-event" />
            </View>
          ) : null}

          {order ? (
            <Pressable accessibilityLabel={`Open ${order.product.name} order`} accessibilityRole="button" className="mt-4 rounded-2xl border border-edge bg-surface p-4" onPress={onOrder} testID="my-night-order">
              <View className="flex-row items-center gap-4">
                <DrinkImage className="h-16 w-16 rounded-xl" index={0} label={order.product.name} />
                <View className="min-w-0 flex-1">
                  <Text className="text-[11px] font-black uppercase tracking-[0.7px] text-ink">Active order</Text>
                  <Text className="mt-1 text-lg font-black text-ink">{order.product.name}</Text>
                  <Text className="mt-1 text-sm text-muted">{orderSummaryLabel(order)}</Text>
                </View>
                <StatusPill status={order.status} />
              </View>
              <View className="mt-4 flex-row items-center">
                <View className="h-1 flex-1 rounded-full bg-primary" />
                <View className="h-3 w-3 rounded-full border-2 border-primary bg-surface" />
                <View className="h-1 flex-1 rounded-full bg-edge" />
              </View>
            </Pressable>
          ) : null}

          {membership ? (
            <Pressable accessibilityLabel={`Open membership ${membership.name}`} accessibilityRole="button" className="mt-4 flex-row items-center rounded-2xl border border-edge bg-surface p-4" onPress={onMembership} testID="my-night-membership">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-verified">
                <Ionicons color={colors.ink} name="ribbon-outline" size={26} />
              </View>
              <View className="ml-4 min-w-0 flex-1">
                <Text className="text-[11px] font-black uppercase tracking-[0.7px] text-ink">Member benefit</Text>
                <Text className="mt-1 text-lg font-black text-ink">{membership.name}</Text>
                <Text className="mt-1 text-sm text-muted">See benefits and presentation</Text>
              </View>
              <Ionicons color={colors.primary} name="chevron-forward" size={22} />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function OrdersScreen({ error, loading = false, offline = false, onBack, onOpen, orders, refreshing = false }: {
  error?: string | null;
  loading?: boolean;
  offline?: boolean;
  onBack: () => void;
  onOpen: (order: RoomOrder) => void;
  orders: RoomOrder[];
  refreshing?: boolean;
}) {
  const sorted = sortOrdersForDisplay(orders);
  const active = sorted.filter((order) => !['fulfilled', 'cancelled'].includes(order.status));
  const past = sorted.filter((order) => ['fulfilled', 'cancelled'].includes(order.status));
  const historyGroups = groupOrdersByLocalDate(past);

  return (
    <AppShell chrome="child" testID="orders-screen">
      <Pressable
        accessibilityLabel="Back to Me"
        accessibilityRole="button"
        className="-ml-3 mt-1 min-h-12 flex-row items-center gap-2 self-start px-3"
        hitSlop={8}
        onPress={onBack}
        testID="orders-back"
      >
        <Ionicons color={colors.primary} name="arrow-back" size={20} />
        <Text className="font-bold text-primary">Back to Me</Text>
      </Pressable>
      <Text accessibilityRole="header" className="mt-2 text-[36px] font-black uppercase tracking-[-0.8px] text-ink">Orders</Text>
      <Text className="text-sm font-semibold text-ink">Active first. History stays.</Text>

      {error ? <View className="mt-5"><ErrorBanner message={error} /></View> : null}
      {refreshing ? (
        <View accessible className="mt-5 flex-row items-center rounded-2xl bg-surface-soft p-4" testID="orders-refreshing">
          <ActivityIndicator color={colors.primary} />
          <Text className="ml-3 flex-1 text-sm font-semibold text-muted">Refreshing venue updates…</Text>
        </View>
      ) : offline ? (
        <View accessible accessibilityRole="alert" className="mt-5 flex-row items-start rounded-2xl bg-attention/25 p-4" testID="orders-offline">
          <Ionicons color={colors.ink} name="cloud-offline-outline" size={21} />
          <Text className="ml-3 flex-1 text-sm font-semibold leading-5 text-ink">Venue updates are unavailable. Showing saved orders.</Text>
        </View>
      ) : null}

      {loading ? (
        <NightCard className="mt-6">
          <View accessible accessibilityLabel="Loading saved and live orders" className="min-h-24 items-center justify-center" testID="orders-loading">
            <ActivityIndicator color={colors.primary} />
            <Text className="mt-3 text-center text-sm font-semibold text-muted">Loading saved and live orders…</Text>
          </View>
        </NightCard>
      ) : null}

      {active.length ? (
        <>
          <Text className="mb-2 mt-6 text-[11px] font-black uppercase tracking-[0.8px] text-ink">Active now</Text>
          <View className="gap-3">
            {active.map((order) => (
              <Pressable
                accessibilityLabel={`Open ${order.product.name} order. ${orderSummaryLabel(order)}. ${formatCurrency(order.product.price, order.product.currency)}`}
                accessibilityRole="button"
                className="rounded-2xl border border-edge bg-surface p-4"
                key={order.id}
                onPress={() => onOpen(order)}
                testID={`order-row-${order.id}`}
              >
                <View className="flex-row items-center">
                  <DrinkImage className="h-14 w-14 rounded-xl" index={order.product.position % 4} label={order.product.name} />
                  <View className="ml-3 min-w-0 flex-1">
                    <Text className="text-xs font-semibold text-muted">{order.roomName || 'Venue'} · {formatOrderTime(order.updatedAt)}</Text>
                    <Text className="mt-1 text-lg font-black text-ink">{order.product.name}</Text>
                  </View>
                  <View className="ml-2 items-end gap-2">
                    <Text className="font-black text-ink">{formatCurrency(order.product.price, order.product.currency)}</Text>
                    <StatusPill status={order.status} />
                  </View>
                </View>
                <CompactOrderRail status={order.status} />
                <View className="mt-4 flex-row items-center border-t border-edge pt-3">
                  <Text className="flex-1 font-extrabold text-primary">View order</Text>
                  <Ionicons color={colors.primary} name="chevron-forward" size={19} />
                </View>
              </Pressable>
            ))}
          </View>
        </>
      ) : !loading ? (
        <NightCard className="mt-6 border-dashed">
          <Text className="text-center font-extrabold text-ink">{offline || error ? 'No saved active orders' : 'No active orders'}</Text>
          <Text className="mt-1 text-center text-sm text-muted">
            {offline ? 'Reconnect to check for newer venue updates.' : 'Accepted orders will appear here as the venue updates them.'}
          </Text>
        </NightCard>
      ) : null}

      {past.length ? (
        <>
          <Text className="mb-2 mt-7 text-[11px] font-black uppercase tracking-[0.8px] text-ink">History</Text>
          <View className="gap-4">
            {historyGroups.map((group) => (
              <View key={group.key}>
                <Text className="mb-2 text-xs font-extrabold text-muted">{group.label}</Text>
                <View className="overflow-hidden rounded-2xl border border-edge bg-surface">
                  {group.orders.map((order, index) => (
                    <Pressable
                      accessibilityLabel={`Open ${order.product.name} order. ${orderSummaryLabel(order)}. ${formatCurrency(order.product.price, order.product.currency)}`}
                      accessibilityRole="button"
                      className={`min-h-20 flex-row items-center px-4 py-3 ${index ? 'border-t border-edge' : ''}`}
                      key={order.id}
                      onPress={() => onOpen(order)}
                      testID={`order-row-${order.id}`}
                    >
                      <View className="min-w-0 flex-1">
                        <Text className="text-xs text-muted">{formatOrderClock(order.updatedAt)}</Text>
                        <Text className="mt-1 font-black text-ink">{order.product.name}</Text>
                      </View>
                      <View className="mx-3"><StatusPill status={order.status} /></View>
                      <Text className="font-black text-ink">{formatCurrency(order.product.price, order.product.currency)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {!orders.length && !loading && !error ? (
        <Text className="mt-4 text-center text-sm leading-5 text-muted">
          {offline ? 'Saved order history is empty. Live venue updates could not be checked.' : 'Your trusted venue order history is empty.'}
        </Text>
      ) : null}

      <View className="mt-6 flex-row items-start rounded-2xl bg-surface-soft p-4">
        <Ionicons color={colors.primary} name="chatbubble-ellipses-outline" size={22} />
        <View className="ml-3 min-w-0 flex-1">
          <Text className="font-extrabold text-ink">Need help with an order?</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">Ask venue staff in person. In-app order support is not configured yet.</Text>
        </View>
      </View>
    </AppShell>
  );
}

export function OrderDetailScreen({ error, loading = false, offline = false, onBack, order, refreshing = false, roomName }: {
  error?: string | null;
  loading?: boolean;
  offline?: boolean;
  onBack: () => void;
  order?: RoomOrder;
  refreshing?: boolean;
  roomName: string;
}) {
  const back = (
    <Pressable
      accessibilityLabel="All orders"
      accessibilityRole="button"
      className="-ml-3 mt-1 min-h-12 flex-row items-center gap-2 self-start px-3"
      hitSlop={8}
      onPress={onBack}
      testID="order-detail-back"
    >
      <Ionicons color={colors.primary} name="arrow-back" size={20} />
      <Text className="font-bold text-primary">All orders</Text>
    </Pressable>
  );

  if (loading && !order) {
    return (
      <AppShell chrome="child" testID="order-detail-screen">
        {back}
        <View accessible accessibilityLabel="Loading order" className="min-h-64 items-center justify-center" testID="order-detail-loading">
          <ActivityIndicator color={colors.primary} />
          <Text accessibilityRole="header" className="mt-4 text-[28px] font-black uppercase text-ink">Loading order</Text>
          <Text className="mt-2 text-center leading-6 text-muted">Checking saved details and venue status…</Text>
        </View>
      </AppShell>
    );
  }

  if (!order) {
    const unavailableCopy = offline
      ? 'The venue is unavailable and no saved order matches this link. No substitute order is shown.'
      : error
        ? 'Saved order details could not be read. No substitute order is shown.'
        : 'This order could not be matched to trusted venue details. No substitute order is shown.';
    return (
      <AppShell chrome="child" testID="order-detail-screen">
        {back}
        {error ? <View className="mt-5"><ErrorBanner message={error} /></View> : null}
        <View className="mt-8">
          <Text accessibilityRole="header" className="text-[32px] font-black uppercase text-ink">Order unavailable</Text>
          <Text className="mt-3 leading-6 text-muted">{unavailableCopy}</Text>
          <View className="mt-6"><PrimaryButton label="Back to orders" onPress={onBack} /></View>
        </View>
      </AppShell>
    );
  }

  const statusCopy = order.status === 'ready'
    ? 'Show this screen at the bar. Staff marks it served.'
    : order.status === 'cancelled'
      ? 'The venue cancelled this order. Refund details will appear here when available.'
      : 'The venue updates this status as your order moves forward.';

  return (
    <AppShell chrome="child" showTempoRail testID="order-detail-screen">
      {back}
      {error ? <View className="mt-4"><ErrorBanner message={error} /></View> : null}
      <View className="mt-2 flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-black uppercase tracking-[0.8px] text-primary">Order status</Text>
          <Text accessibilityRole="header" className="mt-1 text-[32px] font-black uppercase tracking-[-0.5px] text-ink">{order.product.name}</Text>
          <Text className="mt-1 text-sm font-semibold text-primary">For you · At {roomName}</Text>
        </View>
        <StatusPill status={order.status} />
      </View>

      {refreshing ? (
        <View accessible className="mt-5 flex-row items-center rounded-2xl bg-surface-soft p-4" testID="order-detail-refreshing">
          <ActivityIndicator color={colors.primary} />
          <Text className="ml-3 flex-1 text-sm font-semibold text-muted">Checking for a newer venue status…</Text>
        </View>
      ) : offline ? (
        <View accessible accessibilityRole="alert" className="mt-5 flex-row items-start rounded-2xl bg-attention/25 p-4" testID="order-detail-offline">
          <Ionicons color={colors.ink} name="cloud-offline-outline" size={21} />
          <Text className="ml-3 flex-1 text-sm font-semibold leading-5 text-ink">Showing the last saved status. Venue updates are unavailable.</Text>
        </View>
      ) : null}

      {order.status === 'cancelled' ? <View className="mt-5"><ErrorBanner message={statusCopy} /></View> : (
        <View className="mt-5 rounded-2xl bg-surface-soft p-4">
          <Text className="font-extrabold text-ink">{orderSummaryLabel(order)}</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">{statusCopy}</Text>
        </View>
      )}

      <SectionTitle>Progress</SectionTitle>
      <NightCard>
        <View className="flex-row items-start gap-4">
          <View className="min-w-0 flex-1"><OrderTimeline status={order.status} /></View>
          <DrinkImage className="h-48 w-32 rounded-2xl" index={order.product.position % 4} label={order.product.name} testID="order-detail-product-image" />
        </View>
      </NightCard>

      <SectionTitle>Order</SectionTitle>
      <NightCard>
        <View className="flex-row items-start justify-between gap-4">
          <View className="min-w-0 flex-1">
            <Text className="text-lg font-black text-ink">{order.product.name}</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">{order.product.description}</Text>
          </View>
          <Text className="font-black text-ink">{formatCurrency(order.product.price, order.product.currency)}</Text>
        </View>
      </NightCard>

      <SectionTitle>Venue support</SectionTitle>
      <NightCard>
        <View className="flex-row items-start">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-surface-soft">
            <Ionicons color={colors.primary} name="chatbubble-outline" size={22} />
          </View>
          <View className="ml-3 min-w-0 flex-1">
            <Text className="font-extrabold text-ink">Ask {roomName} about this order</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">Talk to venue staff in person. In-app order support is not configured.</Text>
          </View>
        </View>
      </NightCard>

      <SectionTitle>Receipt</SectionTitle>
      <RaisedRow>
        <Ionicons color={colors.primary} name="receipt-outline" size={24} />
        <View className="ml-4 min-w-0 flex-1">
          <Text className="font-bold text-ink">Receipt pending settlement</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">Payment details appear after payment is confirmed.</Text>
        </View>
      </RaisedRow>
    </AppShell>
  );
}

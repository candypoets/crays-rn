// THESIS: Tonight's actionable objects are surfaced together, while durable history stays in Me.
// OWNED WORLD: Credentials and orders read as physical tickets laid on a dark table.
// STORY: Scan urgent credential → track live order → inspect its venue-authoritative detail.
// FIRST VIEWPORT: Current room, ready status, and the next useful action are visible.
// FORM: Empty, loading, cancelled, fulfilled, offline, and deferred-payment states stay textual.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AppShell, RaisedRow, SectionTitle } from '@/components/app/AppShell';
import { PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
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

function StatusPill({ status }: { status: RoomOrder['status'] }) {
  return (
    <View className={`rounded-full px-3 py-1 ${status === 'ready' ? 'bg-success/15' : status === 'cancelled' ? 'bg-error/15' : 'bg-primary/15'}`}>
      <Text className={`text-xs font-black uppercase ${status === 'ready' ? 'text-success' : status === 'cancelled' ? 'text-error' : 'text-primary'}`}>
        {orderStatusLabel(status)}
      </Text>
    </View>
  );
}

function doorItemCopy(item: MyNightDoorItem) {
  if (item.kind === 'credential') return { action: 'Live code ready', icon: 'qr-code-outline' as const, section: 'Ready at the door' };
  if (item.kind === 'rsvp') return { action: 'RSVP saved', icon: 'ticket-outline' as const, section: 'Your next event' };
  return { action: 'View event', icon: 'calendar-outline' as const, section: 'Coming up' };
}

export function MyNightScreen({ doorItem, membership, onBack, onDoorItem, onMembership, onOrder, order, roomName }: { doorItem?: MyNightDoorItem; membership?: RoomMembershipOffer; onBack: () => void; onDoorItem: () => void; onMembership: () => void; onOrder: () => void; order?: RoomOrder; roomName: string }) {
  const copy = doorItem ? doorItemCopy(doorItem) : undefined;

  return (
    <AppShell eyebrow={roomName} testID="my-night-screen" title="My night">
      <Pressable accessibilityLabel="Back to room" accessibilityRole="button" className="-ml-3 mt-1 min-h-12 flex-row items-center gap-2 self-start px-3" hitSlop={8} onPress={onBack} testID="my-night-back">
        <Ionicons color={colors.accent} name="arrow-back" size={18} />
        <Text className="font-bold text-primary">Back to room</Text>
      </Pressable>
      {!doorItem && !membership && !order ? <View className="mt-10 items-center rounded-[28px] border border-dashed border-base-300 p-8"><Ionicons color={colors.accent} name="moon-outline" size={36} /><Text className="mt-4 text-xl font-black text-base-content">Nothing needs you right now</Text><Text className="mt-2 text-center leading-6 text-muted">Tickets, ready orders, and usable benefits from this room appear here.</Text></View> : null}
      {doorItem && copy ? <><SectionTitle>{copy.section}</SectionTitle><Pressable accessibilityLabel={`${copy.action}: ${doorItem.title}`} accessibilityRole="button" onPress={onDoorItem} testID="my-night-event"><RaisedRow><View className={`h-12 w-12 items-center justify-center rounded-xl ${doorItem.kind === 'event' ? 'bg-primary/15' : 'bg-white'}`}><Ionicons color={doorItem.kind === 'event' ? colors.accent : colors.night} name={copy.icon} size={28} /></View><View className="ml-4 flex-1"><Text className="text-lg font-black text-base-content">{doorItem.title}</Text><Text className="mt-1 text-sm text-muted">{doorItem.location} · {copy.action}</Text></View><Ionicons color={colors.accent} name="chevron-forward" size={22} /></RaisedRow></Pressable></> : null}
      {order ? <><SectionTitle>Live order</SectionTitle><Pressable accessibilityLabel={`Open ${order.product.name} order`} accessibilityRole="button" onPress={onOrder} testID="my-night-order"><RaisedRow><View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/15"><Ionicons color={colors.accent} name="wine-outline" size={25} /></View><View className="ml-4 flex-1"><Text className="text-lg font-black text-base-content">{order.product.name}</Text><Text className="mt-1 text-sm text-muted">{orderSummaryLabel(order)}</Text></View><StatusPill status={order.status} /></RaisedRow></Pressable></> : null}
      {membership ? <><SectionTitle>Available benefit</SectionTitle><Pressable accessibilityLabel={`Open membership ${membership.name}`} accessibilityRole="button" onPress={onMembership} testID="my-night-membership"><RaisedRow><Ionicons color={colors.accent} name="ribbon-outline" size={28} /><View className="ml-4 flex-1"><Text className="text-lg font-black text-base-content">{membership.name}</Text><Text className="mt-1 text-sm text-muted">See benefits and presentation</Text></View><Ionicons color={colors.accent} name="chevron-forward" size={22} /></RaisedRow></Pressable></> : null}
    </AppShell>
  );
}

export function OrdersScreen({ onBack, onOpen, orders }: { onBack: () => void; onOpen: (order: RoomOrder) => void; orders: RoomOrder[] }) {
  const active = orders.filter((order) => !['fulfilled', 'cancelled'].includes(order.status));
  const past = orders.filter((order) => ['fulfilled', 'cancelled'].includes(order.status));
  const rows = (items: RoomOrder[]) => <View className="gap-3">{items.map((order) => <Pressable accessibilityLabel={`Open ${order.product.name} order`} accessibilityRole="button" key={order.id} onPress={() => onOpen(order)} testID={`order-row-${order.id}`}><RaisedRow><View className="flex-1"><Text className="text-lg font-black text-base-content">{order.product.name}</Text><Text className="mt-1 text-sm text-muted">{orderSummaryLabel(order)} · {formatCurrency(order.product.price, order.product.currency)}</Text></View><StatusPill status={order.status} /></RaisedRow></Pressable>)}</View>;

  return <AppShell eyebrow="Me" testID="orders-screen" title="Orders"><Pressable accessibilityLabel="Back to Me" accessibilityRole="button" className="-ml-3 mt-1 min-h-12 flex-row items-center gap-2 self-start px-3" hitSlop={8} onPress={onBack} testID="orders-back"><Ionicons color={colors.accent} name="arrow-back" size={18} /><Text className="font-bold text-primary">Back to Me</Text></Pressable>{active.length ? <><SectionTitle>Active now</SectionTitle>{rows(active)}</> : <View className="mt-8 rounded-2xl border border-dashed border-base-300 p-6"><Text className="text-center text-muted">No active orders.</Text></View>}{past.length ? <><SectionTitle>Past</SectionTitle>{rows(past)}</> : null}</AppShell>;
}

export function OrderDetailScreen({ onBack, order, roomName }: { onBack: () => void; order?: RoomOrder; roomName: string }) {
  if (!order) return <AppShell testID="order-detail-screen" title="Order"><View className="mt-10"><Text className="text-xl font-black text-base-content">Order unavailable</Text><Text className="mt-2 leading-6 text-muted">The relay did not return a signed award and matching product.</Text><View className="mt-6"><PrimaryButton label="Back to orders" onPress={onBack} /></View></View></AppShell>;
  const steps: RoomOrder['status'][] = ['pending', 'accepted', 'processing', 'ready', 'fulfilled'];
  const current = steps.indexOf(order.status);

  return <AppShell eyebrow={roomName} testID="order-detail-screen" title="Order details"><Pressable accessibilityLabel="All orders" accessibilityRole="button" className="-ml-3 mt-1 min-h-12 flex-row items-center gap-2 self-start px-3" hitSlop={8} onPress={onBack} testID="order-detail-back"><Ionicons color={colors.accent} name="arrow-back" size={18} /><Text className="font-bold text-primary">All orders</Text></Pressable><View className="mt-6 rounded-[28px] border border-base-300 bg-base-200 p-6"><View className="flex-row items-start justify-between"><View><Text className="text-xs font-black uppercase tracking-[2px] text-muted">Current status</Text><Text className="mt-2 text-3xl font-black text-base-content">{orderStatusLabel(order.status)}</Text></View><StatusPill status={order.status} /></View><Text className="mt-3 leading-6 text-muted">{order.status === 'ready' ? 'Show this screen at the bar. Staff marks it served.' : order.status === 'cancelled' ? 'The venue cancelled this order. Refund details will appear here when available.' : 'The venue updates this status as your order moves forward.'}</Text></View>
    <SectionTitle>Order</SectionTitle><RaisedRow><Text className="flex-1 text-base font-bold text-base-content">1 × {order.product.name}</Text><Text className="font-black text-base-content">{formatCurrency(order.product.price, order.product.currency)}</Text></RaisedRow>
    <SectionTitle>Progress</SectionTitle><View className="gap-3">{steps.map((step, index) => <View className="flex-row items-center" key={step}><View className={`h-8 w-8 items-center justify-center rounded-full ${index <= current ? 'bg-primary' : 'bg-base-300'}`}><Ionicons color="white" name={index <= current ? 'checkmark' : 'ellipse-outline'} size={17} /></View><Text className={`ml-3 font-bold ${index <= current ? 'text-base-content' : 'text-muted'}`}>{orderStatusLabel(step)}</Text></View>)}</View>
    <SectionTitle>Receipt & support</SectionTitle><RaisedRow><Ionicons color={colors.accent} name="receipt-outline" size={24} /><View className="ml-4 flex-1"><Text className="font-bold text-base-content">Receipt pending settlement</Text><Text className="mt-1 text-sm text-muted">Payment details appear after payment is confirmed.</Text></View></RaisedRow><View className="mt-3"><RaisedRow><Ionicons color={colors.accent} name="help-circle-outline" size={24} /><Text className="ml-4 flex-1 font-bold text-base-content">Ask {roomName} about this order</Text></RaisedRow></View>
  </AppShell>;
}

// THESIS: Item configuration makes every price-changing choice visible before the cart.
// OWNED WORLD: One oversized product ticket anchors quantity and recipient commitment.
// STORY: Inspect item → confirm recipient → choose quantity → add with exact total.
// FIRST VIEWPORT: Product, unit price, recipient, quantity, and CTA fit together.
// FORM: Unavailable or stale relay products cannot be committed.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { formatCurrency } from '@/commerce/currency';
import type { RoomProduct } from '@/rooms/types';
import { colors } from '@/theme/colors';

export function ItemScreen({ adding, error, onAdd, onBack, onChangeQuantity, product, quantity, recipientName, roomName }: {
  adding?: boolean;
  error?: string | null;
  onAdd: () => void;
  onBack: () => void;
  onChangeQuantity: (value: number) => void;
  product: RoomProduct;
  quantity: number;
  recipientName?: string;
  roomName: string;
}) {
  return (
    <AppShell eyebrow={roomName} testID="item-screen" title={product.name}>
      <Pressable accessibilityRole="button" className="mt-1 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack}><Ionicons color={colors.accent} name="arrow-back" size={18} /><Text className="font-bold text-primary">Menu</Text></Pressable>
      <View className="mt-5 h-52 items-center justify-center rounded-[34px] bg-primary/10"><Ionicons color={colors.accent} name={product.productKind === 'drink' ? 'wine' : 'fast-food'} size={76} /></View>
      <Text className="mt-6 text-lg leading-7 text-muted">{product.description}</Text>
      <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-base-300 bg-base-200 p-4"><View><Text className="text-xs font-black uppercase tracking-[2px] text-muted">Unit price</Text><Text className="mt-1 text-2xl font-black text-base-content">{formatCurrency(product.price, product.currency)}</Text></View><View className="items-end"><Text className="text-xs font-black uppercase tracking-[2px] text-muted">For</Text><Text className="mt-1 font-extrabold text-base-content">{recipientName || 'Me'}</Text></View></View>
      <View className="mt-5 rounded-2xl bg-base-200 p-4"><Text className="font-extrabold text-base-content">Prepared as listed</Text><Text className="mt-1 text-sm leading-5 text-muted">This venue has not published modifiers for this item. The final review will recheck price and availability.</Text></View>
      <View className="mt-6 flex-row items-center justify-between"><Text className="text-lg font-extrabold text-base-content">Quantity</Text><View className="flex-row items-center gap-4"><Pressable accessibilityLabel="Decrease quantity" className="h-12 w-12 items-center justify-center rounded-full bg-base-200" onPress={() => onChangeQuantity(Math.max(1, quantity - 1))} testID="item-quantity-decrease"><Ionicons color={colors.accent} name="remove" size={22} /></Pressable><Text className="min-w-8 text-center text-xl font-black text-base-content">{quantity}</Text><Pressable accessibilityLabel="Increase quantity" className="h-12 w-12 items-center justify-center rounded-full bg-base-200" onPress={() => onChangeQuantity(Math.min(20, quantity + 1))} testID="item-quantity-increase"><Ionicons color={colors.accent} name="add" size={22} /></Pressable></View></View>
      {error ? <Text accessibilityRole="alert" className="mt-4 text-sm font-semibold text-error">{error}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !product.available || Boolean(adding) }} className="mt-7 min-h-14 items-center justify-center rounded-2xl bg-primary disabled:opacity-40" disabled={!product.available || adding} onPress={onAdd} testID="add-item"><>{adding ? <ActivityIndicator color="white" /> : <Text className="text-base font-black text-white">Add to order · {formatCurrency(product.price * quantity, product.currency)}</Text>}</></Pressable>
    </AppShell>
  );
}

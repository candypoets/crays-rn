// THESIS: Gift review separates purchaser, recipient, delivery, acceptance, and fulfillment.
// OWNED WORLD: The highest-trust commerce frame — one named ticket on the bright field.
// STORY: Recheck people and item → understand decline/refund → inspect method → pay only on a real rail.
// FIRST VIEWPORT: Recipient, item, exact total, method, and decline/refund consequence are visible.
// FORM: Night Playlist board 03 panel 07 — recipient departure, decline, refund pending,
// and deferred payment cannot masquerade as success; nothing is invented beyond line data.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import type { CartLine } from '@/commerce/Cart';
import { formatCurrency } from '@/commerce/currency';
import { DrinkImage, PortraitImage } from '@/components/night/NightPrimitives';
import { colors } from '@/theme/colors';

export function GiftReviewScreen({ line, method, onBack, onChangeMethod }: { line: CartLine; method: string; onBack: () => void; onChangeMethod: () => void }) {
  const total = line.price * line.quantity;
  const recipient = line.recipientName?.trim();
  if (!recipient || !line.recipientPubkey) {
    return (
      <AppShell eyebrow="Gift order" testID="gift-review-screen" title="Gift unavailable">
        <Pressable accessibilityRole="button" className="mt-1 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack}>
          <Ionicons color={colors.primary} name="arrow-back" size={18} />
          <Text className="font-bold text-primary">Choose another person</Text>
        </Pressable>
        <View className="mt-6 rounded-2xl border border-edge bg-surface p-6">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-attention">
            <Ionicons color={colors.ink} name="person-remove-outline" size={28} />
          </View>
          <Text accessibilityRole="header" className="mt-5 text-2xl font-black text-ink">Recipient details are missing</Text>
          <Text className="mt-3 leading-6 text-muted">Choose a named person in the current room before reviewing a gift. No order, message, ticket, or charge has been created.</Text>
        </View>
      </AppShell>
    );
  }
  return (
    <AppShell
      eyebrow="Gift order"
      headerAction={
        <PortraitImage
          className="h-14 w-14 rounded-full border-2 border-verified"
          index={1}
          label="Gift recipient illustration"
        />
      }
      showTempoRail
      testID="gift-review-screen"
      title={`Send a drink to ${recipient}`}
    >
      <Pressable accessibilityRole="button" className="mt-1 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack}>
        <Ionicons color={colors.primary} name="arrow-back" size={18} />
        <Text className="font-bold text-primary">Choose another drink</Text>
      </Pressable>

      <View className="mt-4 flex-row items-center rounded-2xl border border-edge bg-surface p-4">
        <DrinkImage className="h-14 w-14 rounded-2xl" index={1} label={line.name} />
        <View className="ml-4 flex-1">
          <Text className="text-lg font-extrabold text-base-content">{line.name}</Text>
          <Text className="mt-1 text-sm text-muted">Quantity {line.quantity} · from you</Text>
        </View>
        <Text className="ml-3 text-xl font-black text-base-content">{formatCurrency(total, line.currency)}</Text>
      </View>

      <View className="mt-5 flex-row gap-3 rounded-2xl bg-verified p-4">
        <Ionicons color={colors.ink} name="information-circle-outline" size={22} />
        <Text className="flex-1 text-sm leading-5 text-ink">
          The bar receives a normal order. {recipient} receives a private message and claim ticket.
        </Text>
      </View>
      <View className="mt-3 flex-row gap-3 rounded-2xl bg-surface-soft p-4">
        <Ionicons color={colors.ink} name="return-down-back-outline" size={22} />
        <Text className="flex-1 text-sm leading-5 text-base-content">
          They may decline before fulfillment. Refund follows the original payment rail and may show Refund pending first.
        </Text>
      </View>

      <Text className="mt-6 text-xs font-black uppercase tracking-[2px] text-muted">Payment method</Text>
      <Pressable
        accessibilityRole="button"
        className="mt-2 flex-row items-center rounded-2xl border border-edge bg-surface p-4"
        onPress={onChangeMethod}
        testID="gift-payment-method"
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft">
          <Ionicons color={colors.ink} name="wallet-outline" size={24} />
        </View>
        <Text className="ml-4 flex-1 text-lg font-extrabold text-base-content">{method}</Text>
        <Text className="font-bold text-primary">Change</Text>
      </Pressable>

      <View className="mt-5 flex-row gap-3 rounded-2xl bg-surface-soft p-4">
        <Ionicons color={colors.ink} name="construct-outline" size={22} />
        <Text className="flex-1 text-sm leading-5 text-base-content">
          Payment is intentionally deferred in this pilot. No order or gift ticket is created.
        </Text>
      </View>
      <Pressable
        accessibilityState={{ disabled: true }}
        className="mt-6 min-h-14 items-center justify-center rounded-2xl"
        disabled
        style={{ backgroundColor: colors.mutedAction }}
        testID="pay-gift-disabled"
      >
        <Text className="text-base font-black" style={{ color: colors.paper }}>
          Payment unavailable · {formatCurrency(total, line.currency)}
        </Text>
      </Pressable>
    </AppShell>
  );
}

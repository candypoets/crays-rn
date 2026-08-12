// THESIS: Review states the exact fiat commitment and hands payment to the
// venue's hosted Stripe checkout.
// OWNED WORLD: A deliberate downbeat — venue tickets, one method row, one honest total.
// STORY: Recheck items → adjust quantities → inspect method → open Stripe.
// FIRST VIEWPORT: Order lines, total, method, and payment status are visible.
// FORM: Night Playlist board 03 panel 03 — unsupported carts, request failure,
// cancellation, and relay reconciliation stay explicit.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import type { CartState } from '@/commerce/Cart';
import { formatCurrency } from '@/commerce/currency';
import { colors } from '@/theme/colors';

export type CheckoutState = 'idle' | 'opening' | 'opened';

export function ReviewPayScreen({
  cart,
  checkoutDisabledReason,
  checkoutError,
  checkoutState = 'idle',
  method,
  onBack,
  onCheckout,
  onChangeMethod,
  onChangeQuantity,
  onRemove,
  total,
}: {
  cart: CartState;
  checkoutDisabledReason?: string | null;
  checkoutError?: string | null;
  checkoutState?: CheckoutState;
  method: string;
  onBack: () => void;
  onCheckout?: () => void;
  onChangeMethod: () => void;
  onChangeQuantity: (productId: string, quantity: number, recipientPubkey?: string) => void;
  onRemove: (productId: string, recipientPubkey?: string) => void;
  total: number;
}) {
  const currency = cart.lines[0]?.currency || 'EUR';
  const checkoutDisabled =
    !onCheckout ||
    Boolean(checkoutDisabledReason) ||
    checkoutState === 'opening' ||
    checkoutState === 'opened';

  return (
    <AppShell eyebrow={cart.roomName} showTempoRail testID="review-pay-screen" title="Review and pay">
      <Pressable accessibilityRole="button" className="mt-1 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack}>
        <Ionicons color={colors.primary} name="arrow-back" size={18} />
        <Text className="font-bold text-primary">Keep ordering</Text>
      </Pressable>

      <Text className="mt-5 text-xs font-black uppercase tracking-[2px] text-muted">Order</Text>
      <View className="mt-2 gap-3">
        {cart.lines.map((line) => (
          <View className="rounded-2xl border border-edge bg-surface p-4" key={`${line.productId}:${line.recipientPubkey || 'me'}`}>
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-lg font-extrabold text-base-content">{line.name}</Text>
                <Text className="mt-1 text-sm text-muted">{line.recipientName ? `For ${line.recipientName}` : 'For me'}</Text>
              </View>
              <Text className="font-black text-base-content">{formatCurrency(line.price * line.quantity, line.currency)}</Text>
            </View>
            <View className="mt-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Pressable
                  accessibilityLabel={`Decrease ${line.name}`}
                  className="h-12 w-12 items-center justify-center rounded-full bg-surface-soft"
                  onPress={() => onChangeQuantity(line.productId, line.quantity - 1, line.recipientPubkey)}
                >
                  <Ionicons color={colors.ink} name="remove" size={18} />
                </Pressable>
                <Text className="min-w-6 text-center font-black text-base-content">{line.quantity}</Text>
                <Pressable
                  accessibilityLabel={`Increase ${line.name}`}
                  className="h-12 w-12 items-center justify-center rounded-full bg-surface-soft"
                  onPress={() => onChangeQuantity(line.productId, line.quantity + 1, line.recipientPubkey)}
                >
                  <Ionicons color={colors.ink} name="add" size={18} />
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                className="min-h-12 justify-center px-3"
                onPress={() => onRemove(line.productId, line.recipientPubkey)}
              >
                <Text className="font-bold text-error">Remove</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
      <Pressable accessibilityRole="button" className="mt-3 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack}>
        <Ionicons color={colors.primary} name="add-circle-outline" size={20} />
        <Text className="font-bold text-primary">Add another item</Text>
      </Pressable>

      <View className="mt-4 rounded-2xl border border-edge bg-surface p-5">
        <View className="flex-row justify-between">
          <Text className="text-base text-muted">Subtotal</Text>
          <Text className="font-bold text-base-content">{formatCurrency(total, currency)}</Text>
        </View>
        <View className="mt-3 flex-row justify-between">
          <Text className="text-base text-muted">Taxes and fees</Text>
          <Text className="font-bold text-base-content">Included</Text>
        </View>
        <View className="my-4 h-px bg-edge" />
        <View className="flex-row justify-between">
          <Text className="text-xl font-black text-base-content">Total</Text>
          <Text className="text-2xl font-black text-primary">{formatCurrency(total, currency)}</Text>
        </View>
      </View>

      <Text className="mt-6 text-xs font-black uppercase tracking-[2px] text-muted">Payment method</Text>
      <Pressable
        accessibilityRole="button"
        className="mt-2 flex-row items-center rounded-2xl border border-edge bg-surface p-4"
        onPress={onChangeMethod}
        testID="review-payment-method"
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft">
          <Ionicons color={colors.ink} name="wallet-outline" size={24} />
        </View>
        <Text className="ml-4 flex-1 text-lg font-extrabold text-base-content">{method}</Text>
        <Text className="font-bold text-primary">Change</Text>
      </Pressable>

      <View className="mt-5 flex-row gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
        <Ionicons color={colors.primary} name="shield-checkmark-outline" size={22} />
        <Text className="flex-1 text-sm leading-5 text-base-content">
          Stripe opens in a secure browser. The room order appears only after the payment service publishes a signed product award.
        </Text>
      </View>

      {checkoutDisabledReason ? (
        <Text
          accessibilityRole="alert"
          className="mt-4 text-sm font-semibold leading-5 text-error"
          testID="checkout-disabled-reason"
        >
          {checkoutDisabledReason}
        </Text>
      ) : null}
      {checkoutError ? (
        <Text
          accessibilityRole="alert"
          className="mt-4 text-sm font-semibold leading-5 text-error"
          testID="checkout-error"
        >
          {checkoutError}
        </Text>
      ) : null}
      {checkoutState === 'opened' ? (
        <Text className="mt-4 text-sm font-semibold leading-5 text-success" testID="checkout-opened">
          Stripe checkout is open. Finish payment there, then return to Crays.
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: checkoutDisabled }}
        className="mt-6 min-h-14 items-center justify-center rounded-2xl bg-primary disabled:opacity-40"
        disabled={checkoutDisabled}
        onPress={onCheckout}
        testID="place-order"
      >
        {checkoutState === 'opening' ? (
          <ActivityIndicator color={colors.paper} />
        ) : (
          <Text className="text-base font-black text-white">
            {checkoutState === 'opened'
              ? 'Stripe checkout opened'
              : `Continue to Stripe · ${formatCurrency(total, currency)}`}
          </Text>
        )}
      </Pressable>
    </AppShell>
  );
}

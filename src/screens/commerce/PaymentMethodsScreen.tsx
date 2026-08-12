// THESIS: Method selection is an operational pause, never a payment carousel.
// OWNED WORLD: One clean grouped list where every rail tells its true configuration state.
// STORY: Read the honest rails → choose a preference → return to the owning checkout.
// FIRST VIEWPORT: All peer methods, the selected state, and the hosted-checkout truth are visible.
// FORM: Night Playlist board 03 panel 04 — hosted Stripe owns payment entry and
// capability detection; selecting a row never initiates a charge.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { colors } from '@/theme/colors';

const METHODS = [
  { id: 'Wallet', icon: 'wallet-outline' as const, detail: 'Cashu wallet · not connected here' },
  { id: 'Apple Pay', icon: 'logo-apple' as const, detail: 'Offered by Stripe when available' },
  { id: 'Google Pay', icon: 'logo-google' as const, detail: 'Offered by Stripe when available' },
  { id: 'Card', icon: 'card-outline' as const, detail: 'Secure hosted Stripe checkout' },
];

export function PaymentMethodsScreen({ onBack, onSelect, selected }: { onBack: () => void; onSelect: (method: string) => void; selected: string }) {
  return (
    <AppShell eyebrow="Checkout" showTempoRail testID="payment-methods-screen" title="Payment methods">
      <Pressable accessibilityRole="button" className="mt-1 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack}>
        <Ionicons color={colors.primary} name="arrow-back" size={18} />
        <Text className="font-bold text-primary">Review</Text>
      </Pressable>
      <Text className="mt-5 text-base leading-6 text-muted">
        Stripe opens the secure payment page. This selection records your preference; the hosted page decides which methods are available on this device.
      </Text>

      <View className="mt-6 gap-3">
        {METHODS.map((method) => {
          const isSelected = selected === method.id;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              className={`min-h-20 flex-row items-center rounded-2xl border p-4 ${isSelected ? 'border-primary bg-primary/5' : 'border-edge bg-surface'}`}
              key={method.id}
              onPress={() => onSelect(method.id)}
              testID={`payment-${method.id.toLowerCase().replace(/ /g, '-')}`}
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft">
                <Ionicons color={colors.ink} name={method.icon} size={24} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-extrabold text-base-content">{method.id}</Text>
                <Text className="mt-1 text-sm text-muted">{method.detail}</Text>
              </View>
              <Ionicons
                color={isSelected ? colors.primary : colors.radioMuted}
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={24}
              />
            </Pressable>
          );
        })}
      </View>

      <View className="mt-6 flex-row items-start gap-3">
        <Ionicons color={colors.inkMuted} name="shield-checkmark-outline" size={20} />
        <Text className="flex-1 text-sm leading-5 text-muted">
          Crays does not collect payment details. The hosted Stripe page owns payment entry and the methods it offers.
        </Text>
      </View>
    </AppShell>
  );
}

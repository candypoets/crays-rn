// THESIS: Nearby permission follows a concrete room-discovery benefit and names its limits.
// OWNED WORLD: A still Bluetooth signal diagram reads as a doorway sensor, never an active scan.
// STORY: Explain why → state what is not shared → turn it on or use a signed room link.
// FIRST VIEWPORT: The purpose, three privacy boundaries, and both honest actions stay reachable.
// FORM: Denial keeps room links, Messages, and Me usable; no scan animation starts before consent.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { OnboardingShell, PrimaryButton, TextAction } from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

type BluetoothRationaleScreenProps = {
  error?: string | null;
  loading?: boolean;
  onContinue: () => void;
  onMap: () => void;
};

const boundaries = [
  { icon: 'bluetooth-outline' as const, text: 'Bluetooth finds participating rooms only.' },
  { icon: 'lock-closed-outline' as const, text: 'We do not publish your presence or exact location.' },
  { icon: 'person-outline' as const, text: 'You choose when to enter and how you’re seen.' },
];

export function BluetoothRationaleScreen({ error, loading, onContinue, onMap }: BluetoothRationaleScreenProps) {
  return (
    <OnboardingShell showEdgeTabs={false} testID="bluetooth-rationale-screen">
      <Pressable accessibilityLabel="Back to Discover" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full active:bg-surface-soft" onPress={onMap} testID="bluetooth-rationale-back">
        <Ionicons color={colors.ink} name="chevron-back" size={25} />
      </Pressable>

      <View accessibilityLabel="Nearby Bluetooth illustration. Scanning has not started." className="mt-1 h-52 items-center justify-center">
        <View className="absolute h-48 w-48 rounded-full border border-primary/10" />
        <View className="absolute h-36 w-36 rounded-full border border-primary/15" />
        <View className="absolute h-24 w-24 rounded-full border border-primary/25" />
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Ionicons color={colors.surface} name="bluetooth" size={34} />
        </View>
        <View className="absolute bottom-8 left-[28%] h-2.5 w-2.5 rounded-full bg-primary/25" />
      </View>

      <Text accessibilityRole="header" className="text-center text-[34px] font-black leading-[36px] tracking-[-0.8px] text-ink">Why we ask for Nearby</Text>
      <View className="mt-7 gap-5">
        {boundaries.map((boundary) => (
          <View className="flex-row items-start gap-4" key={boundary.text}>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-soft">
              <Ionicons color={colors.primary} name={boundary.icon} size={22} />
            </View>
            <Text className="flex-1 pt-2 text-base leading-6 text-ink">{boundary.text}</Text>
          </View>
        ))}
      </View>

      {error ? <View accessibilityRole="alert" className="mt-5 rounded-2xl border border-error/40 bg-error/10 p-4"><Text className="leading-5 text-error">{error}</Text></View> : null}
      <View className="mt-auto pt-8">
        <PrimaryButton label="Turn on Nearby" loading={loading} onPress={onContinue} testID="bluetooth-continue-button" />
        <TextAction label="Use Map / room link" onPress={onMap} testID="use-map-button" />
        <View className="mt-2 flex-row items-center justify-center gap-2">
          <Ionicons color={colors.inkMuted} name="shield-checkmark-outline" size={16} />
          <Text className="text-center text-xs text-muted">You can change this later in Settings.</Text>
        </View>
      </View>
    </OnboardingShell>
  );
}

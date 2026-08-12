// THESIS: Recovery routes are honest unavailable capabilities, not fake wizards.
// OWNED WORLD: A pale backstage note states what cannot be used and what stays untouched.
// STORY: Name the unavailable methods → reassure nothing is overwritten → return to login.
// FIRST VIEWPORT: Back and mark lead; method truth, no-overwrite truth, one way back.
// FORM: Night Playlist board 02 panel 08 variant — no import, signer, biometric, or cloud claim.
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import {
  BackButton,
  BrandMark,
  OnboardingShell,
  PrimaryButton,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

type AccountRecoveryScreenProps = {
  onBack: () => void;
};

export function AccountRecoveryScreen({ onBack }: AccountRecoveryScreenProps) {
  return (
    <OnboardingShell testID="account-recovery-screen">
      <View className="flex-row items-start justify-between">
        <BackButton onPress={onBack} />
        <BrandMark size={40} />
      </View>

      <View
        accessibilityElementsHidden
        className="mt-10 h-20 w-20 items-center justify-center rounded-full bg-surface-soft"
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons color={colors.ink} name="key-outline" size={32} />
      </View>

      <Text
        accessibilityRole="header"
        className="mt-6 text-[36px] font-extrabold leading-[40px] tracking-[-1px] text-base-content"
      >
        Other ways to log in
      </Text>
      <Text className="mt-4 text-lg leading-7 text-muted">
        Key import, remote signer, and provider recovery are not configured in this build.
      </Text>

      <View className="mt-6 flex-row items-start gap-3 rounded-2xl bg-surface-soft p-4">
        <Ionicons color={colors.ink} name="lock-closed-outline" size={20} />
        <Text className="flex-1 text-sm leading-5 text-ink-muted">
          Your identity, rooms, and preferences on this device stay untouched. No local identity will be overwritten.
        </Text>
      </View>

      <View className="mt-auto pt-8">
        <PrimaryButton label="Back to login" onPress={onBack} />
      </View>
    </OnboardingShell>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import {
  BackButton,
  BrandMark,
  ErrorBanner,
  OnboardingShell,
  PrimaryButton,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

/**
 * THESIS: Recovery is a serious backstage warning, not a feature moment.
 * OWN-WORLD: Pale field, blue lock medallion with quiet rings, one blue committed action.
 * STORY: Device-only custody is stated plainly, then the money/durable guard, then finish.
 * FIRST VIEWPORT: Back and mark lead; medallion, custody truth, guard, then Continue.
 * FORM: Night Playlist board 02 panel 08 family — no biometric, provider, or cloud claim.
 */

type RecoveryScreenProps = {
  error?: string | null;
  loading?: boolean;
  onBack: () => void;
  onFinish: () => void;
};

export function RecoveryScreen({ error, loading = false, onBack, onFinish }: RecoveryScreenProps) {
  return (
    <OnboardingShell testID="recovery-screen">
      <View className="flex-row items-start justify-between">
        <BackButton onPress={onBack} />
        <BrandMark size={40} />
      </View>

      <View
        accessibilityElementsHidden
        className="mt-8 items-center"
        importantForAccessibility="no-hide-descendants"
      >
        <View className="h-32 w-32 items-center justify-center rounded-full bg-surface-soft">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-surface">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Ionicons color={colors.paper} name="lock-closed" size={28} />
            </View>
          </View>
        </View>
      </View>

      <Text
        accessibilityRole="header"
        className="mt-6 text-center text-[34px] font-extrabold leading-[38px] tracking-[-1px] text-base-content"
      >
        Keep your account with you
      </Text>
      <Text className="mt-3 text-center text-lg font-bold text-base-content">This device, for now</Text>
      <Text className="mt-2 text-center text-base leading-6 text-muted">
        Your private key stays protected on this device. Cross-device recovery is not enabled yet.
      </Text>

      <View className="mt-8 flex-row items-start gap-4 rounded-2xl border border-edge bg-surface p-5">
        <View
          accessibilityElementsHidden
          className="mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-primary"
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons color={colors.paper} name="checkmark" size={18} />
        </View>
        <Text className="flex-1 text-sm leading-5 text-base-content">
          Before you add money or buy a durable item, Crays will ask you to add recovery.
        </Text>
      </View>

      <View className="mt-auto pt-8">
        <ErrorBanner message={error} />
        <PrimaryButton
          label="Continue to Discover"
          loading={loading}
          onPress={onFinish}
          testID="finish-account-button"
        />
        <Text className="mt-4 text-center text-sm leading-5 text-muted">
          Crays never shows your private key unless you ask.
        </Text>
      </View>
    </OnboardingShell>
  );
}

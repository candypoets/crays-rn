import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import {
  BackButton,
  ErrorBanner,
  OnboardingShell,
  PaperCard,
  PrimaryButton,
  StageLabel,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

type RecoveryScreenProps = {
  error?: string | null;
  loading?: boolean;
  onBack: () => void;
  onFinish: () => void;
};

export function RecoveryScreen({ error, loading = false, onBack, onFinish }: RecoveryScreenProps) {
  return (
    <OnboardingShell testID="recovery-screen">
      <BackButton onPress={onBack} />
      <StageLabel>Account · 2 of 2</StageLabel>
      <Text
        accessibilityRole="header"
        className="text-[45px] font-extrabold leading-[47px] tracking-[-1.2px] text-base-content"
      >
        Keep your account with you
      </Text>

      <PaperCard className="my-8">
        <View className="flex-row items-center justify-around py-4">
          <View className="h-20 w-14 items-center justify-center rounded-xl bg-base-200">
            <Ionicons color={colors.accent} name="phone-portrait-outline" size={34} />
          </View>
          <View className="h-px flex-1 border-t border-dashed border-base-300/40" />
          <View className="mx-3 h-12 w-12 items-center justify-center rounded-full bg-base-200">
            <Ionicons color={colors.accent} name="lock-closed-outline" size={24} />
          </View>
          <View className="h-px flex-1 border-t border-dashed border-base-300/40" />
          <Ionicons color={colors.primary} name="shield-checkmark-outline" size={46} />
        </View>
        <Text className="mt-4 text-center text-xl font-bold text-base-200">This device, for now</Text>
        <Text className="mt-2 text-center text-base leading-6 text-base-300">
          Your private key stays protected here. Cross-device recovery is not enabled yet.
        </Text>
      </PaperCard>

      <View className="mb-7 flex-row items-start gap-4 rounded-2xl border border-primary bg-base-200 p-5">
        <View className="mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-primary">
          <Ionicons color={colors.paper} name="checkmark" size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-base-content">Continue on this device</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">
            Before you add money or buy a durable item, Crays will ask you to add recovery.
          </Text>
        </View>
      </View>

      <ErrorBanner message={error} />
      <View className="mt-auto">
        <PrimaryButton
          label="Continue to Discover"
          loading={loading}
          onPress={onFinish}
          testID="finish-account-button"
        />
        <Text className="mt-5 text-center text-sm leading-5 text-muted">
          Crays never shows your private key unless you ask.
        </Text>
      </View>
    </OnboardingShell>
  );
}

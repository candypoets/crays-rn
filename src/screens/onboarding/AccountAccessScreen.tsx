import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import {
  BackButton,
  BrandMark,
  ErrorBanner,
  OnboardingShell,
  PaperCard,
  PrimaryButton,
  TextAction,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

type AccountAccessScreenProps = {
  error?: string | null;
  loading?: boolean;
  onBack: () => void;
  onCreateOnDevice: () => void;
  onLogIn: () => void;
};

export function AccountAccessScreen({
  error,
  loading = false,
  onBack,
  onCreateOnDevice,
  onLogIn,
}: AccountAccessScreenProps) {
  return (
    <OnboardingShell testID="account-access-screen">
      <BackButton onPress={onBack} />
      <BrandMark size={58} />

      <Text
        accessibilityRole="header"
        className="mt-6 text-[45px] font-extrabold leading-[47px] tracking-[-1.2px] text-base-content"
      >
        Create your Crays account
      </Text>
      <Text className="mt-4 text-lg leading-7 text-muted">
        A Nostr identity underneath, familiar access on top.
      </Text>

      <View className="my-8">
        <ErrorBanner message={error} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: loading, disabled: loading }}
          className="min-h-24 flex-row items-center gap-4 rounded-2xl border border-base-300 bg-base-200 px-5 py-4 active:border-primary"
          disabled={loading}
          onPress={onCreateOnDevice}
          testID="create-on-device-choice"
        >
          <View className="h-14 w-14 items-center justify-center rounded-full border border-primary">
            <Ionicons color={colors.accent} name="phone-portrait-outline" size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-base-content">Create on this device</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              Your key stays protected on this phone.
            </Text>
          </View>
          <Ionicons color={colors.paper} name="chevron-forward" size={24} />
        </Pressable>
      </View>

      <PaperCard>
        <View className="flex-row items-start gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-base-200">
            <BrandMark size={34} />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-base-200">Your identity stays yours</Text>
            <Text className="mt-2 text-base leading-6 text-base-300">
              Apple and Google access can be added later without becoming your Crays identity.
            </Text>
          </View>
        </View>
      </PaperCard>

      <View className="mt-auto pt-8">
        <PrimaryButton
          label="Create on this device"
          loading={loading}
          onPress={onCreateOnDevice}
          testID="create-on-device-button"
        />
        <TextAction label="I already have an account" onPress={onLogIn} testID="existing-account-button" />
      </View>
    </OnboardingShell>
  );
}

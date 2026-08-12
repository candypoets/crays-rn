// THESIS: Returning access restores interrupted intent before it advertises providers.
// OWNED WORLD: A calm blue lock medallion anchors the one device-unlock action.
// STORY: Welcome back → preserved destination truth → unlock local identity → resume there.
// FIRST VIEWPORT: Back and mark lead; medallion, unlock, then honest unavailable methods.
// FORM: Night Playlist board 02 panel 08 — providers explained as copy, never dead buttons.
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import {
  BackButton,
  BrandMark,
  ErrorBanner,
  OnboardingShell,
  PrimaryButton,
  TextAction,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

type LoginScreenProps = {
  error?: string | null;
  hasDeviceIdentity: boolean;
  loading: boolean;
  onBack: () => void;
  onCreateAccount: () => void;
  onRecovery: () => void;
  onUnlock: () => void;
  preservingInvite: boolean;
};

export function LoginScreen({
  error,
  hasDeviceIdentity,
  loading,
  onBack,
  onCreateAccount,
  onRecovery,
  onUnlock,
  preservingInvite,
}: LoginScreenProps) {
  return (
    <OnboardingShell testID="login-screen">
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
        Welcome back
      </Text>
      <Text className="mt-2 text-center text-lg font-semibold text-base-content">
        Pick up where you left off.
      </Text>
      <Text className="mt-2 text-center text-base leading-6 text-muted">
        {preservingInvite
          ? 'Your invitation is saved while you unlock this account.'
          : 'Unlock the Crays identity protected on this device.'}
      </Text>

      <View className="mt-8">
        <ErrorBanner message={error} />
        <PrimaryButton
          disabled={!hasDeviceIdentity}
          icon={<Ionicons color={colors.paper} name="lock-open-outline" size={22} />}
          label={hasDeviceIdentity ? 'Unlock on this device' : 'No account on this device'}
          loading={loading}
          onPress={onUnlock}
          testID="login-device-unlock"
        />
        <View className="mt-6 flex-row items-start gap-3 rounded-2xl bg-surface-soft p-4">
          <Ionicons color={colors.ink} name="ban-outline" size={20} />
          <View className="flex-1">
            <Text className="text-sm font-bold text-base-content">Provider login isn’t configured</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              Apple and Google sign-in aren’t available in this build.
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-auto pt-8">
        <TextAction label="Other ways to log in" onPress={onRecovery} testID="login-other-ways" />
        <TextAction label="Create a new account" onPress={onCreateAccount} testID="login-create-account" />
      </View>
    </OnboardingShell>
  );
}

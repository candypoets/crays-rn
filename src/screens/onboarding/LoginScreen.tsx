// THESIS: Returning access unlocks this device; first-time access names Nostr login plainly.
// OWNED WORLD: A calm blue lock medallion anchors the one device-unlock action.
// STORY: Welcome back → preserved destination truth → unlock local identity → resume there.
// FIRST VIEWPORT: Back and mark lead; medallion, one correct account action, then the alternative.
// FORM: Night Playlist board 02 panel 08 — no provider theatre and no password language.
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
        {hasDeviceIdentity ? 'Welcome back' : 'Log in with Nostr'}
      </Text>
      <Text className="mt-2 text-center text-lg font-semibold text-base-content">
        {hasDeviceIdentity ? 'Pick up where you left off.' : 'Bring the identity you already use.'}
      </Text>
      <Text className="mt-2 text-center text-base leading-6 text-muted">
        {preservingInvite
          ? 'Your invitation is saved while you unlock this account.'
          : hasDeviceIdentity
            ? 'Unlock the Crays identity saved in this app on this device.'
            : 'Connect a signer app, or import a secret key as an advanced option.'}
      </Text>

      <View className="mt-8">
        <ErrorBanner message={error} />
        {hasDeviceIdentity ? (
          <PrimaryButton
            icon={<Ionicons color={colors.paper} name="lock-open-outline" size={22} />}
            label="Unlock on this device"
            loading={loading}
            onPress={onUnlock}
            testID="login-device-unlock"
          />
        ) : (
          <PrimaryButton
            icon={<Ionicons color={colors.paper} name="key-outline" size={22} />}
            label="Use an existing Nostr identity"
            loading={loading}
            onPress={onRecovery}
            testID="login-existing-identity"
          />
        )}
        <View className="mt-6 flex-row items-start gap-3 rounded-2xl bg-surface-soft p-4">
          <Ionicons color={colors.ink} name="shield-checkmark-outline" size={20} />
          <View className="flex-1">
            <Text className="text-sm font-bold text-base-content">No Crays password</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              A Nostr signer proves which identity is yours. Crays does not need an email or social account.
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-auto pt-8">
        {hasDeviceIdentity ? null : <TextAction label="Choose a login method" onPress={onRecovery} testID="login-other-ways" />}
        <TextAction label="Create a new account" onPress={onCreateAccount} testID="login-create-account" />
      </View>
    </OnboardingShell>
  );
}

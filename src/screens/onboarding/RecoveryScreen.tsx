import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';

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
  custody?: 'device-only' | 'remote-signer' | null;
  error?: string | null;
  loading?: boolean;
  onBack: () => void;
  onFinish: () => void;
};

export function RecoveryScreen({ custody = 'device-only', error, loading = false, onBack, onFinish }: RecoveryScreenProps) {
  const remote = custody === 'remote-signer';
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
        {custody === null ? 'Checking your signing setup' : remote ? 'Your signer keeps the key' : 'Keep your account with you'}
      </Text>
      {custody === null ? (
        <>
          <View accessibilityLabel="Checking identity custody" accessibilityRole="progressbar" accessible className="mt-6 items-center">
            <ActivityIndicator color={colors.primary} />
            <Text className="mt-3 text-center text-base leading-6 text-muted">Reading the saved signing account on this device…</Text>
          </View>
          {error ? <View className="mt-5 w-full"><ErrorBanner message={error} /></View> : null}
        </>
      ) : (
        <>
          <Text className="mt-3 text-center text-lg font-bold text-base-content">{remote ? 'Connected with NIP-46' : 'This device, for now'}</Text>
          <Text className="mt-2 text-center text-base leading-6 text-muted">
            {remote
              ? 'Crays sends signing requests to your connected signer. Your secret key stays there.'
              : 'Crays keeps this signer with the app on this device. Removing Crays removes local access. Cross-device recovery is not enabled yet.'}
          </Text>
        </>
      )}

      {custody !== null ? <View className="mt-8 flex-row items-start gap-4 rounded-2xl border border-edge bg-surface p-5">
        <View
          accessibilityElementsHidden
          className="mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-primary"
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons color={colors.paper} name="checkmark" size={18} />
        </View>
        <Text className="flex-1 text-sm leading-5 text-base-content">
          {remote
            ? 'Keep access to your signer app and its own recovery method. Removing Crays does not delete that Nostr identity.'
            : 'Before you add money or buy a durable item, Crays will ask you to add recovery.'}
        </Text>
      </View> : null}

      {custody !== null ? <View className="mt-auto pt-8">
        <ErrorBanner message={error} />
        <PrimaryButton
          label="Continue to Discover"
          loading={loading}
          onPress={onFinish}
          testID="finish-account-button"
        />
        <Text className="mt-4 text-center text-sm leading-5 text-muted">
          {remote ? 'Crays never receives your signer’s private key.' : 'Crays never shows your private key unless you ask.'}
        </Text>
      </View> : null}
    </OnboardingShell>
  );
}

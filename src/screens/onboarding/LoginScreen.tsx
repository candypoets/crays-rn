// THESIS: Returning access restores interrupted intent before it advertises providers.
// OWNED WORLD: A quiet device-unlock card anchors identity in the person's hand.
// STORY: See preserved destination → unlock local identity → resume exactly there.
// FIRST VIEWPORT: Device unlock and preserved invite are primary; deferred providers are honest.
// FORM: Missing identity, cancelled unlock, unavailable providers, and recovery are explicit.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { BackButton, ErrorBanner, OnboardingShell, PrimaryButton, TextAction } from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

export function LoginScreen({ error, hasDeviceIdentity, loading, onBack, onCreateAccount, onRecovery, onUnlock, preservingInvite }: {
  error?: string | null; hasDeviceIdentity: boolean; loading: boolean; onBack: () => void; onCreateAccount: () => void; onRecovery: () => void; onUnlock: () => void; preservingInvite: boolean;
}) {
  return <OnboardingShell testID="login-screen"><BackButton onPress={onBack} /><Text className="mt-8 text-xs font-black uppercase tracking-[3px] text-primary">Welcome back</Text><Text accessibilityRole="header" className="mt-3 text-[44px] font-extrabold leading-[46px] tracking-[-1px] text-base-content">Pick up where you left off.</Text><Text className="mt-4 text-lg leading-7 text-muted">{preservingInvite ? 'Your invitation is saved while you unlock this account.' : 'Unlock the Crays identity protected on this device.'}</Text><ErrorBanner message={error} />
    <View className="mt-8"><PrimaryButton disabled={!hasDeviceIdentity} icon={<Ionicons color="white" name="lock-open-outline" size={22} />} label={hasDeviceIdentity ? 'Unlock on this device' : 'No account on this device'} loading={loading} onPress={onUnlock} testID="login-device-unlock" /></View>
    <View className="mt-6 gap-3">{['Apple', 'Google'].map((provider) => <Pressable accessibilityState={{ disabled: true }} className="min-h-16 flex-row items-center rounded-2xl border border-base-300 bg-base-200 px-5 opacity-60" disabled key={provider}><Ionicons color={colors.placeholder} name={provider === 'Apple' ? 'logo-apple' : 'logo-google'} size={24} /><Text className="ml-4 flex-1 text-base font-bold text-base-content">Continue with {provider}</Text><Text className="text-xs font-bold uppercase text-muted">Not configured</Text></Pressable>)}</View>
    <View className="mt-auto pt-8"><TextAction label="Other ways to log in" onPress={onRecovery} testID="login-other-ways" /><TextAction label="Create a new account" onPress={onCreateAccount} testID="login-create-account" /></View>
  </OnboardingShell>;
}

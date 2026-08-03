// THESIS: The invitation explains its issuer and durable grant before it asks for an account.
// OWNED WORLD: A warm paper invitation sits inside Crays' dark, private entry space.
// STORY: Reach issuer → match membership → inspect expiry → explicitly accept.
// FIRST VIEWPORT: Venue, grant, legitimacy state, and expiry appear above authentication.
// FORM: Loading, offline, malformed, expired, account-required, redeeming, and retry states are explicit.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';

import type { InvitePreview } from '@/invites/invites';
import { BackButton, ErrorBanner, OnboardingShell, PaperCard, PrimaryButton, TextAction } from '@/components/onboarding/OnboardingPrimitives';
import type { RoomDescriptor } from '@/rooms/types';
import { colors } from '@/theme/colors';

export function InvitePreviewScreen({ error, hasIdentity, loading, onAccept, onBack, onCreateAccount, onLogIn, preview, redeeming, room }: {
  error?: string | null;
  hasIdentity: boolean;
  loading: boolean;
  onAccept: () => void;
  onBack: () => void;
  onCreateAccount: () => void;
  onLogIn: () => void;
  preview: InvitePreview | null;
  redeeming: boolean;
  room: RoomDescriptor | null;
}) {
  const expiry = preview ? new Date(preview.claims.exp * 1000).toLocaleString() : '';
  return <OnboardingShell testID="invite-preview-screen">
    <BackButton onPress={onBack} />
    <Text className="mt-5 text-xs font-black uppercase tracking-[3px] text-primary">Private invitation</Text>
    <Text accessibilityRole="header" className="mt-3 text-[42px] font-extrabold leading-[44px] tracking-[-1px] text-base-content">A place at the table.</Text>
    {loading ? <View className="min-h-72 items-center justify-center"><ActivityIndicator color={colors.primary} size="large" /><Text className="mt-4 text-muted">Checking the issuer and room…</Text></View> : null}
    {!loading && preview ? <>
      <PaperCard className="mt-7">
        <View className="flex-row items-start gap-4"><View className="h-12 w-12 items-center justify-center rounded-full bg-base-200"><Ionicons color={colors.accent} name="ticket-outline" size={25} /></View><View className="flex-1"><Text className="text-xs font-black uppercase tracking-[2px] text-base-300">Invited by</Text><Text className="mt-1 text-2xl font-black text-base-200">{room?.name || 'Membership issuer'}</Text><Text className="mt-2 text-base leading-6 text-base-300">{room?.about || 'The issuer is reachable. The signed room card is still loading.'}</Text></View></View>
        <View className="my-5 h-px bg-base-300/40" />
        <Text className="text-xs font-black uppercase tracking-[2px] text-base-300">You receive</Text><Text className="mt-1 text-xl font-black text-base-200">Room membership</Text>
        <Text className="mt-4 text-xs font-black uppercase tracking-[2px] text-base-300">Accept before</Text><Text className="mt-1 text-base font-bold text-base-200">{expiry}</Text>
      </PaperCard>
      <View className="mt-5 flex-row items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4"><Ionicons color={colors.primary} name="shield-checkmark-outline" size={22} /><Text className="flex-1 text-sm leading-6 text-base-content">Issuer details match this invitation. The venue proves the server signature only when you accept it.</Text></View>
      <ErrorBanner message={error} />
      <View className="mt-7"><PrimaryButton label={hasIdentity ? 'Accept invite' : 'Create account to accept'} loading={redeeming} onPress={hasIdentity ? onAccept : onCreateAccount} testID="invite-accept-button" />{!hasIdentity ? <TextAction label="I already have an account" onPress={onLogIn} testID="invite-login-button" /> : null}</View>
      <Text className="mt-4 text-center text-sm leading-5 text-muted">Accepting grants membership. It never makes you visible or joins the live room.</Text>
    </> : null}
    {!loading && !preview ? <View className="mt-8"><ErrorBanner message={error || 'This invite could not be checked.'} /><PrimaryButton label="Try again" onPress={onAccept} testID="invite-retry-button" /></View> : null}
  </OnboardingShell>;
}

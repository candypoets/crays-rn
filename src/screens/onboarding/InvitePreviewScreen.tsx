// THESIS: The invitation explains its issuer and durable grant before it asks for an account.
// OWNED WORLD: A bright verified invite card waits on the pale lilac entry field.
// STORY: Reach issuer → match membership → inspect grant and expiry → explicitly accept.
// FIRST VIEWPORT: Venue, grant, legitimacy state, and expiry appear above authentication.
// FORM: Night Playlist board 02 panel 04 — loading, offline, malformed, expired,
// account-required, redeeming, and retry states stay explicit; no premature verification.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';

import type { InvitePreview } from '@/invites/invites';
import {
  BackButton,
  BrandMark,
  ErrorBanner,
  OnboardingShell,
  PaperCard,
  PrimaryButton,
  TextAction,
} from '@/components/onboarding/OnboardingPrimitives';
import { VenueImage } from '@/components/night/NightPrimitives';
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
  return (
    <OnboardingShell testID="invite-preview-screen">
      <View className="flex-row items-start justify-between">
        <BackButton onPress={onBack} />
        <BrandMark size={40} />
      </View>
      <Text className="mt-3 -rotate-6 text-xl font-semibold italic text-commitment">You’re invited!</Text>
      <Text
        accessibilityRole="header"
        className="mt-2 text-[36px] font-extrabold leading-[40px] tracking-[-1px] text-base-content"
      >
        A room is waiting for you
      </Text>

      {loading ? (
        <View className="min-h-72 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
          <Text className="mt-4 text-muted">Checking the issuer and room…</Text>
        </View>
      ) : null}

      {!loading && preview ? (
        <>
          <PaperCard className="mt-6">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-soft">
                <Ionicons color={colors.primary} name="ribbon-outline" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-paper-muted">Verified by</Text>
                <Text className="mt-0.5 text-lg font-bold text-paper-ink">{room?.name || 'Membership issuer'}</Text>
              </View>
              {room ? <VenueImage className="h-14 w-14 rounded-full" index={1} label={`${room.name} venue`} /> : null}
            </View>

            <View className="mt-5">
              <Text className="text-xs font-bold uppercase tracking-[2px] text-paper-muted">Room</Text>
              <Text className="mt-1 text-xl font-black text-paper-ink">{room?.name || 'Signed room card loading'}</Text>
              <Text className="mt-1 text-base leading-6 text-paper-muted">
                {room?.about || 'The issuer is reachable. The signed room card is still loading.'}
              </Text>
            </View>

            <View className="my-5 h-px bg-edge" />
            <View className="flex-row gap-4">
              <View className="flex-1 flex-row items-center gap-2">
                <Ionicons color={colors.inkMuted} name="ticket-outline" size={20} />
                <View className="flex-1">
                  <Text className="text-xs font-bold uppercase tracking-[2px] text-paper-muted">Grant</Text>
                  <Text className="mt-0.5 text-base font-bold text-paper-ink">Room membership</Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center gap-2">
                <Ionicons color={colors.inkMuted} name="time-outline" size={20} />
                <View className="flex-1">
                  <Text className="text-xs font-bold uppercase tracking-[2px] text-paper-muted">Expires</Text>
                  <Text className="mt-0.5 text-base font-bold text-paper-ink">{expiry}</Text>
                </View>
              </View>
            </View>
          </PaperCard>

          <View className="mt-5 flex-row items-start gap-3 rounded-2xl bg-surface-soft p-4">
            <Ionicons color={colors.primary} name="shield-checkmark-outline" size={22} />
            <Text className="flex-1 text-sm leading-6 text-base-content">
              Issuer details match this invitation. The venue proves the server signature only when you accept it.
            </Text>
          </View>

          <ErrorBanner message={error} />
          <View className="mt-7">
            <PrimaryButton
              label={hasIdentity ? 'Accept invite' : 'Create account to accept'}
              loading={redeeming}
              onPress={hasIdentity ? onAccept : onCreateAccount}
              testID="invite-accept-button"
            />
            {!hasIdentity ? (
              <TextAction label="I already have an account" onPress={onLogIn} testID="invite-login-button" />
            ) : null}
          </View>
          <Text className="mt-4 text-center text-sm leading-5 text-muted">
            Accepting grants membership. It never makes you visible or joins the live room.
          </Text>
        </>
      ) : null}

      {!loading && !preview ? (
        <View className="mt-8">
          <ErrorBanner message={error || 'This invite could not be checked.'} />
          <PrimaryButton label="Try again" onPress={onAccept} testID="invite-retry-button" />
        </View>
      ) : null}
    </OnboardingShell>
  );
}

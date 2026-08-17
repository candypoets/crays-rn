// THESIS: Success names the durable object and keeps room presence a separate decision.
// OWNED WORLD: A settled blue seal confirms the grant is saved on the pale field.
// STORY: Confirm award → explain ownership → choose membership or explicit room entry.
// FIRST VIEWPORT: Accepted state, venue, durable grant, and next actions are immediate.
// FORM: Night Playlist board 02 panel 04 settled variant — no auto-navigation or
// presence publication occurs from this surface.
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import {
  OnboardingShell,
  PaperCard,
  PrimaryButton,
  TextAction,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

export function InviteAcceptedScreen({ eventId, onJoinRoom, onMembership, roomName }: { eventId: string; onJoinRoom: () => void; onMembership: () => void; roomName: string }) {
  return (
    <OnboardingShell testID="invite-accepted-screen">
      <View
        accessibilityElementsHidden
        className="mt-8"
        importantForAccessibility="no-hide-descendants"
      >
        <View className="h-28 w-28 items-center justify-center rounded-full bg-surface-soft">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-surface">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
              <Ionicons color={colors.paper} name="checkmark" size={30} />
            </View>
          </View>
        </View>
      </View>

      <Text className="mt-8 text-xs font-black uppercase tracking-[3px] text-primary">Invite accepted</Text>
      <Text
        accessibilityRole="header"
        className="mt-3 text-[36px] font-extrabold leading-[40px] tracking-[-1px] text-base-content"
      >
        You’re on the list.
      </Text>
      <Text className="mt-4 text-lg leading-7 text-muted">
        Your membership at {roomName} belongs to this Crays account and remains available after the room closes.
      </Text>

      <PaperCard className="mt-8">
        <Text className="text-xs font-bold uppercase tracking-[2px] text-paper-muted">Granted</Text>
        <Text className="mt-2 text-2xl font-black text-paper-ink">Room membership</Text>
        <Text className="mt-2 text-base text-paper-muted">{roomName}</Text>
        <View className="my-5 h-px bg-edge" />
        <Text className="text-xs text-paper-muted">Signed award · {eventId.slice(0, 12)}…</Text>
      </PaperCard>

      <View className="mt-auto pt-9">
        <PrimaryButton label="View membership" onPress={onMembership} testID="invite-view-membership" />
        <TextAction label="Continue to room preview" onPress={onJoinRoom} testID="invite-join-room" />
        <View className="mt-4 flex-row items-center justify-center gap-2">
          <Ionicons color={colors.inkMuted} name="eye-off-outline" size={18} />
          <Text className="text-sm text-muted">You are not visible in the room.</Text>
        </View>
      </View>
    </OnboardingShell>
  );
}

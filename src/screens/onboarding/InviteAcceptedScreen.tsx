// THESIS: Success names the durable object and keeps room presence a separate decision.
// OWNED WORLD: A stamped paper grant feels possessed, not merely acknowledged.
// STORY: Confirm award → explain ownership → choose membership or explicit room entry.
// FIRST VIEWPORT: Accepted state, venue, durable grant, and next actions are immediate.
// FORM: No auto-navigation or presence publication occurs from this surface.
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { OnboardingShell, PaperCard, PrimaryButton, TextAction } from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

export function InviteAcceptedScreen({ eventId, onJoinRoom, onMembership, roomName }: { eventId: string; onJoinRoom: () => void; onMembership: () => void; roomName: string }) {
  return <OnboardingShell testID="invite-accepted-screen">
    <View className="mt-8 h-20 w-20 items-center justify-center rounded-full bg-primary"><Ionicons color="white" name="checkmark" size={42} /></View>
    <Text className="mt-8 text-xs font-black uppercase tracking-[3px] text-primary">Invite accepted</Text>
    <Text accessibilityRole="header" className="mt-3 text-[44px] font-extrabold leading-[46px] tracking-[-1px] text-base-content">You’re on the list.</Text>
    <Text className="mt-4 text-lg leading-7 text-muted">Your membership at {roomName} belongs to this Crays account and remains available after the room closes.</Text>
    <PaperCard className="mt-8"><Text className="text-xs font-black uppercase tracking-[2px] text-base-300">Granted</Text><Text className="mt-2 text-2xl font-black text-base-200">Room membership</Text><Text className="mt-2 text-base text-base-300">{roomName}</Text><View className="my-5 h-px bg-base-300/40" /><Text className="text-xs text-base-300">Signed award · {eventId.slice(0, 12)}…</Text></PaperCard>
    <View className="mt-auto pt-9"><PrimaryButton label="View membership" onPress={onMembership} testID="invite-view-membership" /><TextAction label="Continue to room preview" onPress={onJoinRoom} testID="invite-join-room" /><View className="mt-4 flex-row items-center justify-center gap-2"><Ionicons color={colors.accent} name="eye-off-outline" size={18} /><Text className="text-sm text-muted">You are not visible in the room.</Text></View></View>
  </OnboardingShell>;
}

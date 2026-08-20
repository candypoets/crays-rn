// THESIS: Changing room state is a deliberate privacy boundary, not a navigation side effect.
// OWNED WORLD: Two verified venue chapters and one clear list of what ends and what stays.
// STORY: Name current state → confirm end/switch → settle protocol → keep durable objects.
// FIRST VIEWPORT: The current room, destination, and precise consequence are visible together.
// FORM: Publishing, destination failure, cancel, quiet leave, and completed lock states are explicit.
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { NightBadge, VenueImage } from '@/components/night/NightPrimitives';
import { ErrorBanner, PrimaryButton, TextAction } from '@/components/onboarding/OnboardingPrimitives';
import type { ActiveRoom, RoomDescriptor } from '@/rooms/types';
import { colors } from '@/theme/colors';

function ConsequenceRow({ children, icon }: { children: ReactNode; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="min-h-14 flex-row items-center border-b border-edge py-3 last:border-b-0">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-soft">
        <Ionicons color={colors.ink} name={icon} size={21} />
      </View>
      <Text className="ml-3 flex-1 text-base font-semibold leading-6 text-ink">{children}</Text>
    </View>
  );
}

function OutlineAction({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      className="mt-2 min-h-12 items-center justify-center rounded-2xl border border-primary px-5 active:bg-surface-soft"
      onPress={onPress}
      testID={testID}
    >
      <Text className="text-base font-extrabold text-ink">{label}</Text>
    </Pressable>
  );
}

export function LeaveRoomScreen({
  error,
  leaving,
  onCancel,
  onLeave,
  room,
}: {
  error?: string | null;
  leaving: boolean;
  onCancel: () => void;
  onLeave: () => void;
  room: ActiveRoom;
}) {
  return (
    <AppShell eyebrow="Privacy control" showTempoRail testID="leave-room-screen" title="Leave room?">
      <View className="relative mt-3 h-40 overflow-hidden rounded-2xl bg-photo-night">
        <VenueImage className="absolute inset-0" index={3} label={`${room.name} entrance`} />
        <View className="absolute inset-0 bg-photo-night/55" />
        <View className="grow justify-end p-5">
          <Text className="text-xs font-black uppercase tracking-[1px] text-verified">Current room</Text>
          <Text accessibilityRole="header" className="mt-1 text-[28px] font-black leading-8 text-white">
            {room.name}
          </Text>
        </View>
      </View>

      <Text className="mt-6 text-lg font-bold leading-7 text-ink">
        Leaving is private. Nothing announces it to the room.
      </Text>
      <View className="mt-3">
        <ConsequenceRow icon="eye-off-outline">Stop appearing in People</ConsequenceRow>
        <ConsequenceRow icon="lock-closed-outline">Lock this room’s live feed</ConsequenceRow>
        <ConsequenceRow icon="archive-outline">Keep messages, orders, tickets, passes, and memberships</ConsequenceRow>
      </View>

      <View className="mt-auto pt-7">
        <ErrorBanner message={error} />
        <PrimaryButton
          label="Leave room and hide me"
          loading={leaving}
          loadingLabel="Leaving…"
          onPress={onLeave}
          testID="leave-room-confirm"
          tone="commitment"
        />
        <TextAction label="Stay in the room" onPress={onCancel} testID="leave-room-cancel" />
      </View>
    </AppShell>
  );
}

const retainedItems: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'chatbubble-ellipses-outline', label: 'Messages' },
  { icon: 'receipt-outline', label: 'Orders' },
  { icon: 'ticket-outline', label: 'Tickets & passes' },
  { icon: 'ribbon-outline', label: 'Memberships' },
  { icon: 'wallet-outline', label: 'Wallet' },
];

export function RoomEndedScreen({
  automatic = false,
  onDiscover,
  onMessages,
  previousRoomName,
  underTabBar = false,
}: {
  automatic?: boolean;
  onDiscover: () => void;
  onMessages: () => void;
  previousRoomName: string;
  underTabBar?: boolean;
}) {
  return (
    <AppShell testID="room-ended-screen" title="Room ended" underTabBar={underTabBar}>
      <View className="relative -mx-5 mt-2 min-h-[278px] overflow-hidden bg-photo-night px-6 py-8">
        <VenueImage className="absolute inset-0" index={3} label={`${previousRoomName} after the room ended`} />
        <View className="absolute inset-0 bg-photo-night/75" />
        <View className="h-12 w-12 items-center justify-center rounded-full bg-surface">
          <Ionicons color={colors.ink} name="lock-closed" size={23} />
        </View>
        <Text accessibilityRole="header" className="mt-7 max-w-[390px] text-[34px] font-black uppercase leading-[35px] tracking-[-0.7px] text-white">
          {automatic ? `Your time at ${previousRoomName} ended` : `You’ve left ${previousRoomName}`}
        </Text>
        <Text className="mt-4 max-w-[390px] text-base font-semibold leading-6 text-white">
          {automatic ? 'Your automatic leave time passed.' : 'Your presence ended.'} The live feed is locked. Nothing announces that you left.
        </Text>
      </View>

      <View className="-mt-4 rounded-t-2xl bg-surface px-4 pb-4 pt-5">
        <View className="flex-row items-start gap-3 border-b border-edge pb-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-soft">
            <Ionicons color={colors.ink} name="shield-checkmark" size={21} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-black text-ink">Your night stays with you</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">Private messages and durable items remain available.</Text>
          </View>
        </View>
        {retainedItems.map((item) => (
          <View className="min-h-12 flex-row items-center border-b border-edge last:border-b-0" key={item.label}>
            <Ionicons color={colors.ink} name={item.icon} size={20} />
            <Text className="ml-3 flex-1 font-semibold text-ink">{item.label}</Text>
            <Text className="text-sm font-bold text-muted">Kept</Text>
          </View>
        ))}
      </View>

      <View className="mt-auto pt-6">
        <PrimaryButton label="Discover another room" onPress={onDiscover} testID="room-ended-discover" />
        <OutlineAction label="Open Messages" onPress={onMessages} testID="room-ended-messages" />
      </View>
    </AppShell>
  );
}

function RoomChapter({
  imageIndex,
  label,
  loading = false,
  room,
}: {
  imageIndex: number;
  label: string;
  loading?: boolean;
  room: RoomDescriptor | null;
}) {
  return (
    <View className="min-h-[112px] flex-row items-center rounded-2xl border border-edge bg-surface p-3">
      <VenueImage
        className="h-[82px] w-[110px] rounded-xl"
        index={imageIndex}
        label={room ? `${room.name} venue` : undefined}
      />
      <View className="ml-4 min-w-0 flex-1">
        <Text className="text-[11px] font-black uppercase tracking-[0.7px] text-muted">{label}</Text>
        {loading ? (
          <View className="mt-3 flex-row items-center gap-2">
            <ActivityIndicator color={colors.primary} />
            <Text className="flex-1 text-sm font-semibold text-muted">Verifying destination…</Text>
          </View>
        ) : (
          <>
            <Text className="mt-1 text-lg font-black text-ink">{room?.name || 'Destination unavailable'}</Text>
            {room ? <Text className="mt-1 text-sm text-muted">{room.about}</Text> : null}
            {room?.verified ? <NightBadge tone="verified">Verified room</NightBadge> : null}
          </>
        )}
      </View>
    </View>
  );
}

export function SwitchRoomScreen({
  current,
  destination,
  error,
  loading,
  onCancel,
  onSwitch,
  switching,
}: {
  current: ActiveRoom;
  destination: RoomDescriptor | null;
  error?: string | null;
  loading: boolean;
  onCancel: () => void;
  onSwitch: () => void;
  switching: boolean;
}) {
  return (
    <AppShell showTempoRail testID="switch-room-screen" title="Change rooms?">
      <View className="mt-3">
        <RoomChapter imageIndex={0} label="You are in" room={current} />
        <View className="z-10 -my-3 self-center rounded-full border-2 border-primary bg-surface p-2">
          <Ionicons color={colors.primary} name="arrow-down" size={20} />
        </View>
        <RoomChapter imageIndex={2} label="You’re entering" loading={loading} room={destination} />
      </View>

      <View className="mt-6 items-center px-3">
        <Ionicons color={colors.ink} name="swap-vertical-outline" size={25} />
        <Text className="mt-2 text-center text-base font-bold leading-6 text-ink">
          Your presence and live feed access will end in {current.name}.
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-muted">
          Messages, active orders, tickets, passes, memberships, and wallet state remain.
        </Text>
      </View>

      <View className="mt-auto pt-7">
        <ErrorBanner message={error} />
        <PrimaryButton
          disabled={!destination || loading}
          label="Leave and enter new room"
          loading={switching}
          loadingLabel="Switching rooms…"
          onPress={onSwitch}
          testID="switch-room-confirm"
          tone="commitment"
        />
        <OutlineAction label={`Stay in ${current.name}`} onPress={onCancel} testID="switch-room-cancel" />
      </View>
    </AppShell>
  );
}

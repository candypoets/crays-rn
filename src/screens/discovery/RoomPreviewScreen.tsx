// THESIS: A room earns trust before it asks for proximity or presence.
// OWNED WORLD: The venue card is a signed door placard with explicit capabilities.
// STORY: Verify operator → understand what is here → choose Enter room.
// FIRST VIEWPORT: Venue identity, verification, and event utility appear before the CTA.
// FORM: Closed, stale, offline, and unsupported manifests disable entry with a reason.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { AppShell, RaisedRow, SectionTitle } from '@/components/app/AppShell';
import { PrimaryButton, TextAction } from '@/components/onboarding/OnboardingPrimitives';
import type { RoomDescriptor } from '@/rooms/types';
import { colors } from '@/theme/colors';

export function RoomPreviewScreen({ error, loading, room }: { error?: string | null; loading?: boolean; room?: RoomDescriptor | null }) {
  return <AppShell scroll testID="room-preview-screen">{loading ? (
    <View className="min-h-[520px] items-center justify-center"><ActivityIndicator color={colors.primary} size="large" /><Text className="mt-4 text-muted">Verifying this room…</Text></View>
  ) : room ? (
    <><View className="-mx-5 h-56 justify-end bg-[#21131b] px-6 pb-7"><Text className="text-xs font-bold uppercase tracking-[4px] text-base-content">{room.name}</Text><View className="mt-2 flex-row items-center gap-2"><Ionicons color={colors.primary} name="shield-checkmark-outline" size={21} /><Text className="font-bold text-base-content">Verified room</Text></View></View>
      <Text accessibilityRole="header" className="mt-7 text-[42px] font-extrabold leading-[44px] text-base-content">Rooftop jazz</Text><Text className="mt-2 text-xl font-semibold text-muted">Tonight · Doors 20:30</Text><Text className="mt-5 text-base leading-7 text-muted">{room.about}</Text>
      <SectionTitle>Inside this room</SectionTitle><RaisedRow><Ionicons color={colors.accent} name="people-outline" size={26} /><Text className="ml-4 flex-1 text-base font-semibold text-base-content">People, room feed and private messages</Text></RaisedRow><View className="mt-3"><RaisedRow><Ionicons color={colors.accent} name="wine-outline" size={26} /><Text className="ml-4 flex-1 text-base font-semibold text-base-content">Menu, events and memberships</Text></RaisedRow></View>
      <View className="mt-7"><PrimaryButton disabled={!room.open} label={room.open ? 'Enter room' : 'Room closed'} onPress={() => router.push({ pathname: '/bluetooth-rationale' as never, params: { relay: room.relayUrl, room: room.id } } as never)} testID="enter-room-button" /><TextAction label="Not now" onPress={() => router.back()} testID="room-preview-cancel" /></View></>
  ) : (
    <View className="min-h-[520px] justify-center"><Ionicons color={colors.accent} name="warning-outline" size={42} /><Text accessibilityRole="header" className="mt-5 text-3xl font-extrabold text-base-content">Room could not be verified</Text><Text className="mt-3 text-base leading-6 text-muted">{error || 'The room card is missing, stale, or signed by another identity.'}</Text><View className="mt-7"><PrimaryButton label="Back to Discover" onPress={() => router.replace('/discover')} /></View></View>
  )}</AppShell>;
}

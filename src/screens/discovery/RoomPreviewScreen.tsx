// THESIS: A room earns trust through its signed identity before it asks for presence.
// OWNED WORLD: One immersive venue hero carries verified identity, signed description, and capabilities.
// STORY: Verify the room → preview its signed utility → explicitly continue to privacy selection.
// FIRST VIEWPORT: Atmosphere, verification, description, Preview, and Enter stay together.
// FORM: Closed, unauthorized, malformed, and offline room definitions never inherit a verified visual state.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NightBadge, VenueImage } from '@/components/night/NightPrimitives';
import { PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import type { RoomDescriptor } from '@/rooms/types';
import { colors } from '@/theme/colors';

type RoomPreviewScreenProps = {
  error?: string | null;
  loading?: boolean;
  onEnter?: () => void;
  room?: RoomDescriptor | null;
};

const capabilityLabels: Record<string, string> = {
  event: 'Events',
  events: 'Events',
  feed: 'Live feed',
  membership: 'Memberships',
  memberships: 'Memberships',
  menu: 'Orders',
  messages: 'Chat',
  social: 'People & chat',
};

export function RoomPreviewScreen({ error, loading, onEnter, room }: RoomPreviewScreenProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas" testID="room-preview-screen">
        <ActivityIndicator color={colors.primary} size="large" />
        <Text className="mt-4 text-muted">Verifying this room…</Text>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" testID="room-preview-screen">
        <View className="mx-auto w-full max-w-[620px] grow justify-center px-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-attention">
            <Ionicons color={colors.ink} name="warning-outline" size={34} />
          </View>
          <Text accessibilityRole="header" className="mt-5 text-3xl font-extrabold text-ink">Room could not be verified</Text>
          <Text className="mt-3 text-base leading-6 text-muted">{error || 'The room card is missing, stale, or signed by another identity.'}</Text>
          <View className="mt-7"><PrimaryButton label="Back to Discover" onPress={() => router.replace('/discover')} /></View>
        </View>
      </SafeAreaView>
    );
  }

  const capabilities = room.capabilities.map((capability) => capabilityLabels[capability] || capability);
  return (
    <SafeAreaView className="flex-1 bg-photo-night" edges={['top', 'left', 'right', 'bottom']} testID="room-preview-screen">
      <StatusBar style="light" />
      <ScrollView contentContainerClassName="grow" showsVerticalScrollIndicator={false}>
        <View className="relative min-h-[610px] grow overflow-hidden bg-photo-night">
          <VenueImage className="absolute inset-0" index={1} label={`${room.name} venue atmosphere`} />
          <View className="absolute inset-0 bg-photo-night/45" />

          <View className="flex-row items-center justify-between px-5 pt-3">
            <Pressable accessibilityLabel="Back to Discover" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-photo-night/55" onPress={() => router.back()} testID="room-preview-cancel">
              <Ionicons color={colors.surface} name="chevron-back" size={25} />
            </Pressable>
            <View className="h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-photo-night/55">
              <Ionicons color={colors.surface} name="ellipsis-horizontal" size={24} />
            </View>
          </View>

          <View className="mt-auto px-5 pb-5">
            <NightBadge tone="verified">Verified room</NightBadge>
            <View className="mt-3 flex-row items-center gap-2">
              <Text accessibilityRole="header" className="min-w-0 flex-1 text-[34px] font-black leading-[36px] tracking-[-0.8px] text-white">{room.name}</Text>
              <Ionicons color={colors.primary} name="checkmark-circle" size={24} />
            </View>
            {room.about ? <Text className="mt-2 text-base leading-6 text-white">{room.about}</Text> : null}
            {capabilities.length ? (
              <View className="mt-4 flex-row flex-wrap gap-2">
                {capabilities.map((capability) => <View className="rounded-full border border-white/60 bg-photo-night/45 px-3 py-1.5" key={capability}><Text className="text-xs font-bold text-white">{capability}</Text></View>)}
              </View>
            ) : null}

            <View className="mt-5 flex-row gap-3">
              <Pressable accessibilityRole="button" className="min-h-14 flex-1 items-center justify-center rounded-2xl bg-primary px-4" onPress={() => setShowDetails((value) => !value)} testID="room-preview-details">
                <Text className="font-black text-white">{showDetails ? 'Hide preview' : 'Preview room'}</Text>
              </Pressable>
              <View className="flex-1">
                <PrimaryButton disabled={!room.open} label={room.open ? 'Enter room' : 'Room closed'} onPress={() => onEnter?.()} testID="enter-room-button" tone="commitment" />
              </View>
            </View>
            <Text className="mt-3 text-center text-xs leading-5 text-white">Direct links, Map and QR entry do not require Bluetooth.</Text>
          </View>
        </View>

        {showDetails ? (
          <View className="bg-canvas px-5 py-7" testID="room-preview-content">
            <Text accessibilityRole="header" className="text-2xl font-black text-ink">Inside this room</Text>
            <Text className="mt-2 leading-6 text-muted">Previewing reads only the signed room card. It does not open the live feed or publish presence.</Text>
            <View className="mt-4 gap-3">
              {(capabilities.length ? capabilities : ['Room information']).map((capability) => (
                <View className="flex-row items-center rounded-2xl border border-edge bg-surface p-4" key={capability}>
                  <Ionicons color={colors.primary} name="checkmark-circle-outline" size={23} />
                  <Text className="ml-3 flex-1 font-bold text-ink">{capability}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

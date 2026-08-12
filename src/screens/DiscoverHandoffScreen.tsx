// THESIS: Discovery is tonight's verified room list, never a people or popularity feed.
// OWNED WORLD: Venue photography, signed-room labels, and one Map/Nearby control share a cue sheet.
// STORY: See a verified room → inspect its preview, or understand Nearby before granting permission.
// FIRST VIEWPORT: Room identity and the channel switch appear without diagnostics or attendance claims.
// FORM: Map stays disabled without a contract; development fixtures remain visibly subordinate.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NightBadge, VenueImage } from '@/components/night/NightPrimitives';
import { BrandMark, PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import type { RoomDescriptor } from '@/rooms/types';
import { colors } from '@/theme/colors';

type Props = {
  accountReady?: boolean;
  error?: string | null;
  loading?: boolean;
  mapAvailable?: boolean;
  mode: 'map' | 'nearby';
  onChangeMode: (mode: 'map' | 'nearby') => void;
  room?: RoomDescriptor | null;
  onOpenRoom?: (room: RoomDescriptor) => void;
  onOpenTestRoom?: (room: RoomDescriptor) => void;
  testRoom?: {
    error?: string | null;
    loading: boolean;
    room?: RoomDescriptor | null;
    testBuild?: boolean;
  };
};

function DiscoveryTabs({ mapAvailable, mode, onChangeMode }: Pick<Props, 'mapAvailable' | 'mode' | 'onChangeMode'>) {
  return (
    <View accessibilityRole="tablist" className="mt-6 flex-row rounded-2xl border border-edge bg-surface p-1">
      {(['map', 'nearby'] as const).map((value) => {
        const active = mode === value;
        const disabled = value === 'map' && !mapAvailable;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active, disabled }}
            className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl ${active ? 'bg-primary' : ''}`}
            disabled={disabled}
            key={value}
            onPress={() => !disabled && onChangeMode(value)}
            testID={`discover-${value}-tab`}
          >
            <Ionicons color={disabled ? colors.placeholder : active ? colors.surface : colors.ink} name={value === 'map' ? 'map-outline' : 'radio-outline'} size={20} />
            <Text className={`text-base font-bold ${disabled ? 'text-muted/50' : active ? 'text-white' : 'text-ink'}`}>{value === 'map' ? 'Map' : 'Nearby'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RoomResult({ mode, onOpen, room }: { mode: Props['mode']; onOpen: () => void; room: RoomDescriptor }) {
  return (
    <View className="mt-5">
      <Text className="mb-3 text-xs font-black uppercase tracking-[0.7px] text-ink">{mode === 'nearby' ? 'Nearby now' : 'Verified result'}</Text>
      <Pressable
        accessibilityLabel={`Preview verified room ${room.name}`}
        accessibilityRole="button"
        className="h-60 overflow-hidden rounded-2xl border-4 border-primary bg-photo-night active:opacity-85"
        onPress={onOpen}
        testID="room-result-card"
      >
        <VenueImage className="absolute inset-0" index={1} label={`${room.name} venue`} />
        <View className="absolute inset-0 bg-photo-night/45" />
        <View className="absolute left-3 top-3">
          <NightBadge tone="verified">Verified</NightBadge>
        </View>
        <View className="absolute right-3 top-3 h-11 w-11 items-center justify-center rounded-full bg-surface">
          <Ionicons color={colors.primary} name="checkmark" size={25} />
        </View>
        <View className="absolute bottom-0 left-0 right-0 p-4">
          <View className="flex-row items-center gap-2">
            <Text className="min-w-0 flex-1 text-[25px] font-black text-white">{room.name}</Text>
            <Ionicons color={colors.primary} name="checkmark-circle" size={21} />
          </View>
          <Text numberOfLines={2} className="mt-1 text-sm text-white">{room.about}</Text>
          <Text className="mt-3 text-sm font-black uppercase text-white">Preview room →</Text>
        </View>
      </Pressable>
    </View>
  );
}

export function DiscoverHandoffScreen({
  accountReady = true,
  error,
  loading = false,
  mapAvailable = true,
  mode,
  onChangeMode,
  onOpenRoom,
  onOpenTestRoom,
  room,
  testRoom,
}: Props) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']} testID="discover-screen">
      <ScrollView contentContainerClassName="grow px-5 pb-8" showsVerticalScrollIndicator={false}>
        <View className="mx-auto w-full max-w-[620px] grow">
          <View className="flex-row items-center justify-between pt-2">
            <BrandMark size={34} />
            <Ionicons color={colors.ink} name="notifications-outline" size={24} />
          </View>
          <View className="mt-6">
            <Text className="text-sm font-black uppercase tracking-[0.7px] text-ink">Tonight</Text>
            <Text accessibilityRole="header" className="text-[34px] font-black uppercase leading-[35px] tracking-[-0.8px] text-ink">Rooms around you</Text>
            <Text className="mt-2 text-sm leading-5 text-muted">Only verified, signed rooms appear here. Crays never enters one for you.</Text>
          </View>

          {accountReady ? (
            <View className="mt-4 flex-row items-center gap-2" testID="account-ready-banner">
              <View className="h-2.5 w-2.5 rounded-full bg-success" />
              <Text className="flex-1 text-xs leading-5 text-muted"><Text className="font-black text-success">Account ready.</Text> No Bluetooth or location permission asked — Nearby only uses them if you turn it on.</Text>
            </View>
          ) : null}

          {loading ? (
            <View className="min-h-64 items-center justify-center" testID="discover-loading">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text className="mt-4 text-base text-muted">Checking this room’s signature…</Text>
            </View>
          ) : room ? (
            <RoomResult mode={mode} onOpen={() => onOpenRoom ? onOpenRoom(room) : router.push({ pathname: '/room-preview' as never, params: { relay: room.relayUrl, room: room.id } } as never)} room={room} />
          ) : (
            <View className="mt-6 rounded-2xl border border-edge bg-surface p-5">
              <View className="flex-row items-start gap-4">
                <View className={`h-12 w-12 items-center justify-center rounded-full ${mode === 'nearby' ? 'bg-verified' : 'bg-surface-soft'}`}>
                  <Ionicons color={colors.ink} name={mode === 'map' ? 'map-outline' : 'bluetooth'} size={25} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-lg font-black text-ink">{mode === 'map' ? 'No room selected yet' : 'Nearby is off'}</Text>
                  <Text className="mt-1 text-sm leading-5 text-muted">{mode === 'map' ? 'Open a signed room link, or choose Nearby at a participating venue.' : 'Crays explains Nearby before Android asks for permission.'}</Text>
                </View>
              </View>
              {mode === 'nearby' ? <View className="mt-5"><PrimaryButton label="Learn about Nearby" onPress={() => router.push('/bluetooth-rationale' as never)} testID="nearby-rationale-button" /></View> : null}
            </View>
          )}

          {!mapAvailable ? (
            <View className="mt-4 border-l-4 border-attention bg-attention/15 p-4">
              <Text className="font-black text-ink">Map search isn’t available yet</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">Open a signed room link from the venue, or use Nearby when you’re there. Crays won’t invent places or call an unverified listing verified.</Text>
            </View>
          ) : null}
          {error ? <Text accessibilityLiveRegion="polite" className="mt-5 text-base text-error">{error}</Text> : null}

          <DiscoveryTabs mapAvailable={mapAvailable} mode={mode} onChangeMode={onChangeMode} />

          {testRoom ? (
            <View className="mt-8 border-t border-edge pt-4" testID="dev-test-room-card">
              <Text className="text-[11px] font-bold uppercase tracking-[1px] text-muted">{testRoom.testBuild ? 'Test build' : 'Developer'}</Text>
              <View className="mt-3 flex-row items-center rounded-2xl border border-edge bg-surface p-4">
                <Ionicons color={colors.placeholder} name="flask-outline" size={22} />
                <View className="ml-3 min-w-0 flex-1">
                  <Text className="font-bold text-ink">Test room</Text>
                  <Text className="mt-0.5 text-sm text-muted">{testRoom.room ? `${testRoom.room.name || 'Crays Test Room'} is online` : testRoom.loading ? 'Connecting…' : testRoom.testBuild ? 'Test Room is unavailable' : 'Offline — run npm run test-room'}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityState={{ disabled: !testRoom.room }} className="min-h-12 items-center justify-center rounded-xl border border-edge px-4" disabled={!testRoom.room} onPress={() => testRoom.room && onOpenTestRoom?.(testRoom.room)} testID="open-test-room">
                  <Text className={`font-bold ${testRoom.room ? 'text-primary' : 'text-muted/60'}`}>{testRoom.room ? 'Open' : 'Offline'}</Text>
                </Pressable>
              </View>
              <Text className="mt-3 text-xs leading-5 text-muted">Bluetooth is not required. Visible entry redeems the reusable test invite through the same Nearby pointer path.</Text>
              {!mapAvailable ? <Text className="mt-3 text-xs text-muted" testID="search-unavailable-dev-note">Search service design pending · D-001</Text> : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

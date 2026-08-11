// THESIS: Discovery is a verified-room gateway, not a popularity feed.
// OWNED WORLD: Maps, room tickets, and nearby signals share one room identity.
// STORY: Inspect a verified room → open its preview, or learn why Nearby helps.
// FIRST VIEWPORT: The newcomer sees consent truth and one honest path in, never diagnostics.
// FORM: Map stays disabled while search is unavailable; dev fixtures live in a dev-only section.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppShell, RaisedRow, SectionTitle } from '@/components/app/AppShell';
import { PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
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
  };
};

export function DiscoverHandoffScreen({ accountReady = true, error, loading = false, mapAvailable = true, mode, onChangeMode, onOpenRoom, onOpenTestRoom, room, testRoom }: Props) {
  return (
    <AppShell testID="discover-screen">
      <View className="pt-2">
        <Text accessibilityRole="header" className="text-[44px] font-extrabold leading-[46px] tracking-[-1px] text-base-content">Discover rooms</Text>
        <Text className="mt-3 text-base leading-6 text-muted">Choose a verified room — Crays never enters one for you.</Text>
      </View>
      {accountReady ? (
        <View className="mt-5 rounded-2xl border border-success/40 bg-success/10 p-4" testID="account-ready-banner">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-success">Account ready</Text>
          <Text className="mt-2 text-sm leading-5 text-base-content">No Bluetooth or location permission asked — Nearby only uses them if you turn it on.</Text>
        </View>
      ) : null}
      <View accessibilityRole="tablist" className="mt-6 flex-row rounded-full border border-base-300 bg-base-200 p-1">
        {(['map', 'nearby'] as const).map((value) => {
          const active = mode === value;
          const disabled = value === 'map' && !mapAvailable;
          return (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: active, disabled }} className={`min-h-12 flex-1 items-center justify-center rounded-full ${active ? 'bg-base-300' : ''}`} disabled={disabled} key={value} onPress={() => !disabled && onChangeMode(value)} testID={`discover-${value}-tab`}>
              <Text className={`text-base font-bold ${disabled ? 'text-muted/60' : active ? 'text-base-content' : 'text-muted'}`}>{value === 'map' ? 'Map' : 'Nearby'}</Text>
            </Pressable>
          );
        })}
      </View>
      {loading ? (
        <View className="min-h-64 items-center justify-center" testID="discover-loading"><ActivityIndicator color={colors.primary} size="large" /><Text className="mt-4 text-base text-muted">Checking this room’s signature…</Text></View>
      ) : room ? (
        <><SectionTitle>{mode === 'nearby' ? 'Nearby now' : 'Room result'}</SectionTitle>
          <Pressable accessibilityLabel={`View ${room.name}`} accessibilityRole="button" className="overflow-hidden rounded-[24px] border border-base-300 bg-base-200 active:opacity-80" onPress={() => onOpenRoom ? onOpenRoom(room) : router.push({ pathname: '/room-preview' as never, params: { relay: room.relayUrl, room: room.id } } as never)} testID="room-result-card">
            <View className="h-32 justify-end bg-paper-ink p-5"><Ionicons color={colors.accent} name="sparkles" size={32} /><Text className="mt-2 text-xs font-bold uppercase tracking-[3px] text-base-content">{room.name}</Text></View>
            <View className="p-5"><View className="flex-row items-center gap-2"><Ionicons color={colors.primary} name="shield-checkmark-outline" size={20} /><Text className="font-bold text-base-content">Verified room</Text></View><Text className="mt-3 text-base leading-6 text-muted">{room.about}</Text><Text className="mt-4 font-bold text-primary">View room →</Text></View>
          </Pressable></>
      ) : (
        <View className="mt-7"><RaisedRow><Ionicons color={colors.accent} name={mode === 'map' ? 'map-outline' : 'bluetooth-outline'} size={28} /><View className="ml-4 flex-1"><Text className="text-lg font-bold text-base-content">{mode === 'map' ? 'No room selected yet' : 'Nearby is off'}</Text><Text className="mt-1 text-sm leading-5 text-muted">{mode === 'map' ? 'Open a room link or choose Nearby when you are at a participating venue.' : 'Crays will explain Nearby before Android asks for permission.'}</Text></View></RaisedRow>
          {mode === 'nearby' ? <View className="mt-5"><PrimaryButton label="Learn about Nearby" onPress={() => router.push('/bluetooth-rationale' as never)} testID="nearby-rationale-button" /></View> : null}
          {!mapAvailable ? (
            <View className="mt-4"><RaisedRow><Ionicons color={colors.accent} name="cloud-offline-outline" size={28} /><View className="ml-4 flex-1"><Text className="text-lg font-bold text-base-content">Map search isn’t available yet</Text><Text className="mt-1 text-sm leading-5 text-muted">Open a signed room link from the venue, or use Nearby when you’re there. Crays won’t invent places or call an unverified listing verified.</Text></View></RaisedRow></View>
          ) : null}
        </View>
      )}
      {error ? <Text accessibilityLiveRegion="polite" className="mt-5 text-base text-error">{error}</Text> : null}
      {testRoom ? (
        <View className="mt-8 border-t border-base-300 pt-4" testID="dev-test-room-card">
          <Text className="text-[11px] font-bold uppercase tracking-[2px] text-muted">Developer</Text>
          <View className="mt-3 flex-row items-center rounded-2xl border border-base-300 bg-base-200 p-4">
            <Ionicons color={colors.placeholder} name="flask-outline" size={22} />
            <View className="ml-3 min-w-0 flex-1">
              <Text className="font-bold text-base-content">Test room</Text>
              <Text className="mt-0.5 text-sm text-muted">{testRoom.room ? `${testRoom.room.name || 'Crays Test Room'} is online` : testRoom.loading ? 'Connecting…' : 'Offline — run npm run test-room'}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: !testRoom.room }} className="min-h-12 items-center justify-center rounded-full border border-base-300 px-5" disabled={!testRoom.room} onPress={() => testRoom.room && onOpenTestRoom?.(testRoom.room)} testID="open-test-room">
              <Text className={`font-bold ${testRoom.room ? 'text-primary' : 'text-muted/60'}`}>{testRoom.room ? 'Open' : 'Offline'}</Text>
            </Pressable>
          </View>
          {!mapAvailable ? <Text className="mt-3 text-xs text-muted" testID="search-unavailable-dev-note">Search service design pending · D-001</Text> : null}
        </View>
      ) : null}
    </AppShell>
  );
}

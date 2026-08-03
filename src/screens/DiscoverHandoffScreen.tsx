// THESIS: Discovery is a verified-room gateway, not a popularity feed.
// OWNED WORLD: Maps, room tickets, and nearby signals share one room identity.
// STORY: Choose Map or Nearby → inspect verification → open one room preview.
// FIRST VIEWPORT: The discovery mode and any fresh direct room are immediately actionable.
// FORM: Search/permission states preserve direct-link and account destinations.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AppShell, RaisedRow, SectionTitle } from '@/components/app/AppShell';
import { PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import type { RoomDescriptor } from '@/rooms/types';
import { colors } from '@/theme/colors';

type Props = {
  accountReady?: boolean;
  error?: string | null;
  loading?: boolean;
  mode: 'map' | 'nearby';
  onChangeMode: (mode: 'map' | 'nearby') => void;
  room?: RoomDescriptor | null;
  onOpenRoom?: (room: RoomDescriptor) => void;
  onOpenTestRoom?: (room: RoomDescriptor) => void;
  searchUnavailable?: boolean;
  testRoom?: {
    error?: string | null;
    loading: boolean;
    room?: RoomDescriptor | null;
  };
};

export function DiscoverHandoffScreen({ accountReady = true, error, loading = false, mode, onChangeMode, onOpenRoom, onOpenTestRoom, room, searchUnavailable = false, testRoom }: Props) {
  return (
    <AppShell testID="discover-screen">
      <View className="pt-2">
        <Text accessibilityRole="header" className="text-[44px] font-extrabold leading-[46px] tracking-[-1px] text-base-content">Discover rooms</Text>
        <Text className="mt-3 text-base leading-6 text-muted">Choose a verified room. Crays never enters the strongest nearby signal for you.</Text>
      </View>
      {mode === 'map' && !room ? <View className="mt-6 gap-3"><TextInput accessibilityLabel="Search rooms" className="min-h-12 rounded-2xl border border-base-300 bg-base-200 px-4 text-base text-muted" editable={false} placeholder="Search rooms or areas" placeholderTextColor={colors.placeholder} testID="discover-search-disabled" /><View className="flex-row flex-wrap gap-2">{['Restaurant', 'Club', 'Event', 'Community'].map((category) => <View accessibilityState={{ disabled: true }} className="rounded-full border border-base-300 px-4 py-2" key={category}><Text className="font-bold text-muted">{category}</Text></View>)}</View></View> : null}
      {accountReady ? (
        <View className="mt-5 rounded-2xl border border-success/40 bg-success/10 p-4" testID="account-ready-banner">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-success">Account ready</Text>
          <Text className="mt-2 text-sm leading-5 text-base-content">No Bluetooth or location permission was requested.</Text>
        </View>
      ) : null}
      <View accessibilityRole="tablist" className="mt-6 flex-row rounded-full border border-base-300 bg-base-200 p-1">
        {(['map', 'nearby'] as const).map((value) => {
          const active = mode === value;
          return (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} className={`min-h-12 flex-1 items-center justify-center rounded-full ${active ? 'bg-base-300' : ''}`} key={value} onPress={() => onChangeMode(value)} testID={`discover-${value}-tab`}>
              <Text className={`text-base font-bold ${active ? 'text-base-content' : 'text-muted'}`}>{value === 'map' ? 'Map' : 'Nearby'}</Text>
            </Pressable>
          );
        })}
      </View>
      {testRoom ? <View className="mt-6 overflow-hidden rounded-[24px] border border-primary/30 bg-primary/10" testID="dev-test-room-card">
        <View className="flex-row items-start p-5"><View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/15"><Ionicons color={colors.accent} name="flask-outline" size={25} /></View><View className="ml-4 min-w-0 flex-1"><Text className="text-xs font-black uppercase tracking-[2px] text-primary">Development test mode</Text><Text className="mt-1 text-xl font-black text-base-content">{testRoom.room?.name || 'Crays Test Room'}</Text><Text className="mt-2 text-sm leading-5 text-muted">{testRoom.room ? 'Signed room fixture is online. Bluetooth is not required.' : testRoom.loading ? 'Connecting to the local signed test relay…' : 'Test relay is offline. Run npm run test-room in another terminal.'}</Text>{testRoom.error && !testRoom.room ? <Text className="mt-2 text-xs font-bold text-error">No verified manifest received yet.</Text> : null}</View></View>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !testRoom.room }} className="min-h-14 items-center justify-center bg-primary px-5 disabled:bg-base-300" disabled={!testRoom.room} onPress={() => testRoom.room && onOpenTestRoom?.(testRoom.room)} testID="open-test-room"><Text className={`font-black ${testRoom.room ? 'text-white' : 'text-muted'}`}>{testRoom.room ? 'Open test room' : 'Waiting for test relay'}</Text></Pressable>
      </View> : null}
      {loading ? (
        <View className="min-h-64 items-center justify-center" testID="discover-loading"><ActivityIndicator color={colors.primary} size="large" /><Text className="mt-4 text-base text-muted">Checking the room signature…</Text></View>
      ) : room ? (
        <><SectionTitle>{mode === 'nearby' ? 'Nearby now' : 'Room result'}</SectionTitle>
          <Pressable accessibilityLabel={`View ${room.name}`} accessibilityRole="button" className="overflow-hidden rounded-[24px] border border-base-300 bg-base-200 active:opacity-80" onPress={() => onOpenRoom ? onOpenRoom(room) : router.push({ pathname: '/room-preview' as never, params: { relay: room.relayUrl, room: room.id } } as never)} testID="room-result-card">
            <View className="h-32 justify-end bg-paper-ink p-5"><Ionicons color={colors.accent} name="sparkles" size={32} /><Text className="mt-2 text-xs font-bold uppercase tracking-[3px] text-base-content">{room.name}</Text></View>
            <View className="p-5"><View className="flex-row items-center gap-2"><Ionicons color={colors.primary} name="shield-checkmark-outline" size={20} /><Text className="font-bold text-base-content">Verified room</Text></View><Text className="mt-3 text-base leading-6 text-muted">{room.about}</Text><Text className="mt-4 font-bold text-primary">View room →</Text></View>
          </Pressable></>
      ) : searchUnavailable && mode === 'map' ? (
        <View className="mt-7 rounded-[24px] border border-error/40 bg-error/10 p-5" testID="search-unavailable-state"><View className="flex-row items-start"><Ionicons color={colors.accent} name="cloud-offline-outline" size={29} /><View className="ml-4 flex-1"><Text className="text-lg font-black text-base-content">Map and search are not configured</Text><Text className="mt-2 text-sm leading-6 text-muted">Direct signed room links and Nearby manifests still work. Crays will not fabricate places or mark an unverified listing as verified.</Text></View></View><Text className="mt-4 text-xs font-bold uppercase tracking-[2px] text-error">Search service design pending · D-001</Text></View>
      ) : (
        <View className="mt-7"><RaisedRow><Ionicons color={colors.accent} name={mode === 'map' ? 'map-outline' : 'bluetooth-outline'} size={28} /><View className="ml-4 flex-1"><Text className="text-lg font-bold text-base-content">{mode === 'map' ? 'No room selected yet' : 'Nearby is off'}</Text><Text className="mt-1 text-sm leading-5 text-muted">{mode === 'map' ? 'Open a room link or choose Nearby when you are at a participating venue.' : 'Crays will explain Nearby before Android asks for permission.'}</Text></View></RaisedRow>
          {mode === 'nearby' ? <View className="mt-5"><PrimaryButton label="Learn about Nearby" onPress={() => router.push('/bluetooth-rationale' as never)} testID="nearby-rationale-button" /></View> : null}
        </View>
      )}
      {error ? <Text accessibilityLiveRegion="polite" className="mt-5 text-base text-error">{error}</Text> : null}
    </AppShell>
  );
}

// THESIS: Tonight is the one doorway into a verified venue and later becomes the live room.
// OWNED WORLD: One venue photograph, signed-room proof, and three honest physical entry paths.
// STORY: Find tonight's place → inspect privacy in a native sheet → enter one room.
// FIRST VIEWPORT: The strongest verified room and every available entry path remain visible.
// FORM: Loading, empty, signature failure, and development-room states never invent availability.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { NightBadge, TempoRail, VenueImage } from '@/components/night/NightPrimitives';
import type { RoomDescriptor } from '@/rooms/types';
import { colors } from '@/theme/colors';

type Props = {
  accountReady?: boolean;
  error?: string | null;
  loading?: boolean;
  mapAvailable?: boolean;
  mode?: 'map' | 'nearby';
  onChangeMode?: (mode: 'map' | 'nearby') => void;
  onMap?: () => void;
  onNearby?: () => void;
  onOpenRoom?: (room: RoomDescriptor) => void;
  onOpenTestRoom?: (room: RoomDescriptor) => void;
  onScan?: () => void;
  room?: RoomDescriptor | null;
  testRoom?: { error?: string | null; loading: boolean; room?: RoomDescriptor | null; testBuild?: boolean };
};

function EntryAction({ enabled, icon, label, onPress, testID }: { enabled: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; testID: string }) {
  return (
    <Pressable
      accessibilityLabel={`${label}${enabled ? '' : ', unavailable'}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      className={`min-h-24 flex-1 items-center justify-center rounded-2xl border border-edge bg-surface px-2 ${enabled ? 'active:bg-surface-soft' : 'opacity-50'}`}
      disabled={!enabled}
      onPress={onPress}
      testID={testID}
    >
      <Ionicons color={enabled ? colors.primary : colors.inkMuted} name={icon} size={25} />
      <Text className="mt-2 text-center text-sm font-extrabold text-ink">{label}</Text>
    </Pressable>
  );
}

function RoomResult({ onOpen, room }: { onOpen: () => void; room: RoomDescriptor }) {
  return (
    <Pressable
      accessibilityLabel={`Open verified room ${room.name}`}
      accessibilityRole="button"
      className="mt-5 h-64 overflow-hidden rounded-2xl bg-photo-night active:opacity-85"
      onPress={onOpen}
      testID="room-result-card"
    >
      <VenueImage className="absolute inset-0" index={1} label={`${room.name} venue`} />
      <View className="absolute inset-0 bg-photo-night/45" />
      <View className="absolute left-4 top-4"><NightBadge tone="verified">Verified room</NightBadge></View>
      <View className="absolute bottom-0 left-0 right-0 p-5">
        <Text className="text-[28px] font-black leading-8 text-white">{room.name}</Text>
        {room.about ? <Text className="mt-1 text-sm leading-5 text-white" numberOfLines={2}>{room.about}</Text> : null}
        <View className="mt-4 flex-row items-center gap-2">
          <Text className="font-black text-white">Preview & enter</Text>
          <Ionicons color={colors.surface} name="arrow-forward" size={19} />
        </View>
      </View>
    </Pressable>
  );
}

export function DiscoverHandoffScreen({ accountReady = true, error, loading = false, onMap, onNearby, onOpenRoom, onOpenTestRoom, onScan, room, testRoom }: Props) {
  const featured = room || testRoom?.room;
  const openFeatured = () => featured && (room ? onOpenRoom?.(featured) : onOpenTestRoom?.(featured));
  return (
    <AppShell testID="tonight-find-screen" title="Tonight" underTabBar>
      <Text accessibilityRole="header" className="mt-2 text-[38px] font-black leading-[40px] tracking-[-1px] text-ink">Find your room</Text>
      <Text className="mt-2 text-base leading-6 text-muted">One verified place for this night. Preview it before Crays joins or publishes presence.</Text>
      <TempoRail className="mt-5" testID="tonight-tempo" />

      {accountReady ? (
        <View accessible accessibilityLabel="Crays ID ready on this device" className="mt-4 flex-row items-center gap-2" testID="account-ready-banner">
          <View className="h-2.5 w-2.5 rounded-full bg-success" />
          <Text className="flex-1 text-sm font-semibold text-muted">Your Crays ID is ready on this device.</Text>
        </View>
      ) : null}

      {loading ? (
        <View className="min-h-64 items-center justify-center" testID="discover-loading">
          <ActivityIndicator color={colors.primary} size="large" />
          <Text className="mt-4 text-base text-muted">Verifying tonight’s room…</Text>
        </View>
      ) : featured ? <RoomResult onOpen={openFeatured} room={featured} /> : (
        <View className="mt-5 rounded-2xl border border-edge bg-surface p-5" testID="tonight-empty">
          <Text className="text-lg font-black text-ink">No room link yet</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">Use a venue QR, signed map link, or Nearby once you arrive.</Text>
        </View>
      )}

      {error ? <Text accessibilityRole="alert" className="mt-4 text-sm font-semibold leading-5 text-error">{error}</Text> : null}

      <Text className="mb-3 mt-7 text-xs font-black uppercase tracking-[0.8px] text-ink">Other ways in</Text>
      <View className="flex-row gap-3">
        <EntryAction enabled={Boolean(onScan)} icon="qr-code-outline" label="Scan QR" onPress={onScan} testID="tonight-scan" />
        <EntryAction enabled={Boolean(onMap)} icon="map-outline" label="Map" onPress={onMap} testID="tonight-map" />
        <EntryAction enabled={Boolean(onNearby)} icon="radio-outline" label="Nearby" onPress={onNearby} testID="tonight-nearby" />
      </View>
      <Text className="mt-3 text-xs leading-5 text-muted">Crays asks for Bluetooth or location only after you choose a feature that needs it.</Text>

      {testRoom && !testRoom.room ? (
        <View className="mt-7 border-t border-edge pt-4" testID="dev-test-room-card">
          <Text className="text-xs font-bold text-muted">{testRoom.testBuild ? 'Test build' : 'Developer'} · Test Room {testRoom.loading ? 'connecting' : 'unavailable'}</Text>
        </View>
      ) : null}
    </AppShell>
  );
}

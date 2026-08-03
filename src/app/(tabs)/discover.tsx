import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useRoomManifest } from '@/rooms/useRoomManifest';
import { DiscoverHandoffScreen } from '@/screens/DiscoverHandoffScreen';
import { useRoomSession } from '@/session/RoomSession';
import { useNearbyRoom } from '@/discovery/useNearbyRoom';
import { DEV_TEST_RELAY_URL, DEV_TEST_ROOM_ID, DEV_TEST_ROOM_INVITE_URL } from '@/config/testRoom';

export default function DiscoverRoute() {
  const params = useLocalSearchParams<{ relay?: string; room?: string; nearby?: string }>();
  const focused = useIsFocused();
  const [mode, setMode] = useState<'map' | 'nearby'>(params.nearby === '1' ? 'nearby' : 'map');
  const { activeRoom } = useRoomSession();
  const nearby = useNearbyRoom(focused && mode === 'nearby' && params.nearby === '1' && !params.relay);
  const transportRelay = params.relay || nearby.pointer?.relayUrl;
  const roomId = params.room || nearby.pointer?.roomId;
  const manifest = useRoomManifest(transportRelay, roomId);
  const testRoom = useRoomManifest(__DEV__ ? DEV_TEST_RELAY_URL : undefined, DEV_TEST_ROOM_ID);
  return <DiscoverHandoffScreen error={manifest.error || nearby.error} loading={manifest.loading || nearby.scanning} mode={mode} onChangeMode={(next) => { setMode(next); if (next === 'nearby' && params.nearby !== '1') router.push({ pathname: '/bluetooth-rationale', params: { relay: params.relay, room: params.room } } as never); }} room={manifest.room} searchUnavailable={mode === 'map' && !transportRelay} testRoom={__DEV__ ? testRoom : undefined} onOpenTestRoom={(room) => router.push({ pathname: activeRoom && activeRoom.id !== room.id ? '/switch-room' : '/room-preview', params: { relay: DEV_TEST_RELAY_URL, room: DEV_TEST_ROOM_ID, invite: DEV_TEST_ROOM_INVITE_URL } } as never)} onOpenRoom={(room) => router.push({ pathname: activeRoom && activeRoom.id !== room.id ? '/switch-room' : '/room-preview', params: { relay: transportRelay || room.relayUrl, room: room.id } } as never)} />;
}

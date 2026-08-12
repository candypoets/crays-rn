import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useRoomManifest } from '@/rooms/useRoomManifest';
import { DiscoverHandoffScreen } from '@/screens/DiscoverHandoffScreen';
import { useRoomSession } from '@/session/RoomSession';
import { useNearbyRoom } from '@/discovery/useNearbyRoom';
import { DEV_TEST_ROOM_ID, resolveDevTestInviteUrl, resolveDevTestRelayUrl } from '@/config/testRoom';

export default function DiscoverRoute() {
  const params = useLocalSearchParams<{ relay?: string; room?: string; nearby?: string; testRelay?: string }>();
  const focused = useIsFocused();
  const [mode, setMode] = useState<'map' | 'nearby'>(params.nearby === '1' || !params.relay ? 'nearby' : 'map');
  const { activeRoom } = useRoomSession();
  const nearby = useNearbyRoom(focused && mode === 'nearby' && params.nearby === '1' && !params.relay);
  const transportRelay = params.relay || nearby.pointer?.relayUrl;
  const roomId = params.room || nearby.pointer?.roomId;
  const testRelayUrl = resolveDevTestRelayUrl(params.testRelay);
  const testInviteUrl = resolveDevTestInviteUrl(testRelayUrl);
  const manifest = useRoomManifest(transportRelay, roomId);
  // A second manifest hook with the same relay+room would reuse subId
  // `room_manifest_crays-test-room`, and relays replace a REQ that reuses an ID.
  const duplicatesPrimaryManifest = transportRelay === testRelayUrl && roomId === DEV_TEST_ROOM_ID;
  const testRoom = useRoomManifest(__DEV__ && !duplicatesPrimaryManifest ? testRelayUrl : undefined, DEV_TEST_ROOM_ID);
  const changeMode = (next: 'map' | 'nearby') => {
    // Map stays unselectable while no search/direct relay exists (D-001), and
    // re-tapping the active tab must not navigate anywhere.
    if (next === mode || (next === 'map' && !transportRelay)) return;
    setMode(next);
    if (next === 'nearby' && params.nearby !== '1') router.push({ pathname: '/bluetooth-rationale', params: { relay: params.relay, room: params.room } } as never);
  };
  return <DiscoverHandoffScreen error={manifest.error || nearby.error} loading={manifest.loading || nearby.scanning} mapAvailable={!!transportRelay} mode={mode} onChangeMode={changeMode} room={manifest.room} testRoom={__DEV__ && !duplicatesPrimaryManifest ? testRoom : undefined} onOpenTestRoom={(room) => router.push({ pathname: activeRoom && activeRoom.id !== room.id ? '/switch-room' : '/room-preview', params: { relay: testRelayUrl, room: DEV_TEST_ROOM_ID, invite: testInviteUrl } } as never)} onOpenRoom={(room) => router.push({ pathname: activeRoom && activeRoom.id !== room.id ? '/switch-room' : '/room-preview', params: { relay: transportRelay || room.relayUrl, room: room.id } } as never)} />;
}

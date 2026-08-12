import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { createTestRoomPointer, TEST_ROOM_BUILD } from '@/config/testRoom';
import { nearbyRoomEntryParams } from '@/discovery/blePointer';
import { useNearbyRoom } from '@/discovery/useNearbyRoom';
import { useRoomManifest } from '@/rooms/useRoomManifest';
import { DiscoverHandoffScreen } from '@/screens/DiscoverHandoffScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function DiscoverRoute() {
  const params = useLocalSearchParams<{ relay?: string; room?: string; nearby?: string }>();
  const focused = useIsFocused();
  const [mode, setMode] = useState<'map' | 'nearby'>(params.nearby === '1' || !params.relay ? 'nearby' : 'map');
  const { activeRoom } = useRoomSession();
  const nearby = useNearbyRoom(focused && mode === 'nearby' && params.nearby === '1' && !params.relay);
  const transportRelay = params.relay || nearby.pointer?.relayUrl;
  const roomId = params.room || nearby.pointer?.roomId;
  const manifest = useRoomManifest(transportRelay, roomId);
  const testPointer = createTestRoomPointer();
  // A second manifest hook with the same relay+room would reuse subId
  // `room_manifest_crays-test-room`, and relays replace a REQ that reuses an ID.
  const duplicatesPrimaryManifest = transportRelay === testPointer?.relayUrl && roomId === testPointer?.roomId;
  const testRoom = useRoomManifest(
    testPointer && !duplicatesPrimaryManifest ? testPointer.relayUrl : undefined,
    testPointer?.roomId,
  );
  const changeMode = (next: 'map' | 'nearby') => {
    // Map stays unselectable while no search/direct relay exists (D-001), and
    // re-tapping the active tab must not navigate anywhere.
    if (next === mode || (next === 'map' && !transportRelay)) return;
    setMode(next);
    if (next === 'nearby' && params.nearby !== '1') router.push({ pathname: '/bluetooth-rationale', params: { relay: params.relay, room: params.room } } as never);
  };
  const open = (room: { id: string }, entryParams: ReturnType<typeof nearbyRoomEntryParams>) => {
    router.push({
      pathname: activeRoom && activeRoom.id !== room.id ? '/switch-room' : '/room-preview',
      params: entryParams,
    } as never);
  };
  return (
    <DiscoverHandoffScreen
      error={manifest.error || nearby.error}
      loading={manifest.loading || nearby.scanning}
      mapAvailable={!!transportRelay}
      mode={mode}
      onChangeMode={changeMode}
      room={manifest.room}
      testRoom={TEST_ROOM_BUILD && testPointer && !duplicatesPrimaryManifest ? { ...testRoom, testBuild: !__DEV__ } : undefined}
      onOpenTestRoom={(room) => testPointer && open(room, nearbyRoomEntryParams(testPointer))}
      onOpenRoom={(room) => {
        const pointer = nearby.pointer?.roomId === room.id ? nearby.pointer : null;
        open(room, pointer ? nearbyRoomEntryParams(pointer) : { relay: transportRelay || room.relayUrl, room: room.id });
      }}
    />
  );
}

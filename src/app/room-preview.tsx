import { router, useLocalSearchParams } from 'expo-router';

import { useRoomManifest } from '@/rooms/useRoomManifest';
import { RoomPreviewScreen } from '@/screens/discovery/RoomPreviewScreen';

export default function RoomPreviewRoute() {
  const params = useLocalSearchParams<{ relay?: string; room?: string }>();
  const manifest = useRoomManifest(params.relay, params.room);
  return <RoomPreviewScreen error={manifest.error} loading={manifest.loading} onEnter={() => router.push({ pathname: '/join-room', params } as never)} room={manifest.room} />;
}

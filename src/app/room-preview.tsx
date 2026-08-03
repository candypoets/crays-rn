import { useLocalSearchParams } from 'expo-router';

import { useRoomManifest } from '@/rooms/useRoomManifest';
import { RoomPreviewScreen } from '@/screens/discovery/RoomPreviewScreen';

export default function RoomPreviewRoute() {
  const params = useLocalSearchParams<{ relay?: string; room?: string }>();
  const manifest = useRoomManifest(params.relay, params.room);
  return <RoomPreviewScreen error={manifest.error} loading={manifest.loading} room={manifest.room} />;
}

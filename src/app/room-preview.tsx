import { router, useLocalSearchParams } from 'expo-router';

import { useRoomDefinition } from '@/rooms/useRoomDefinition';
import { RoomPreviewScreen } from '@/screens/discovery/RoomPreviewScreen';

export default function RoomPreviewRoute() {
  const params = useLocalSearchParams<{ invite?: string; relay?: string; room?: string; service?: string; token?: string }>();
  const definition = useRoomDefinition(params.relay, params.room);
  return <RoomPreviewScreen error={definition.error} loading={definition.loading} onEnter={() => router.push({ pathname: '/join-room', params } as never)} room={definition.room} />;
}

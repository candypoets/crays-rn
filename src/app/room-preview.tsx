import { Redirect, useLocalSearchParams } from 'expo-router';

export default function RoomPreviewRoute() {
  const params = useLocalSearchParams<{ invite?: string; relay?: string; room?: string; service?: string; token?: string }>();
  return <Redirect href={{ pathname: '/join-room', params } as never} />;
}

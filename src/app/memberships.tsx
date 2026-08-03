import { router } from 'expo-router';
import { useRoomData } from '@/rooms/RoomData';
import { MembershipsScreen } from '@/screens/durable/MembershipEventScreens';

export default function MembershipsRoute() {
  const { entitlements } = useRoomData();
  return <MembershipsScreen
    entitlements={entitlements}
    onBack={() => router.canGoBack() ? router.back() : router.replace('/me')}
    onOpen={(item) => router.push({ pathname: '/membership-detail', params: { awardId: item.awardId } } as never)}
  />;
}

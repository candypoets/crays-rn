import { router, useLocalSearchParams } from 'expo-router';

import { useRoomData } from '@/rooms/RoomData';
import { OrderDetailScreen, orderVenueName } from '@/screens/durable/NightAndOrderScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function OrderRoute() {
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const data = useRoomData();
  const { activeRoom } = useRoomSession();
  const order = data.orders.find((item) => item.orderRef === ref);
  const waitingForOrder = !data.archiveHydrated || Boolean(activeRoom && data.loading && !order);
  return (
    <OrderDetailScreen
      error={data.archiveError}
      loading={waitingForOrder}
      offline={Boolean(activeRoom && data.archiveHydrated && !data.loading && !data.connected)}
      onBack={() => router.replace('/orders' as never)}
      order={order}
      refreshing={Boolean(activeRoom && data.loading && order)}
      roomName={orderVenueName(order, activeRoom?.name)}
    />
  );
}

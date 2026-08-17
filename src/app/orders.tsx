import { router } from 'expo-router';

import { useRoomData } from '@/rooms/RoomData';
import { OrdersScreen } from '@/screens/durable/NightAndOrderScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function OrdersRoute() {
  const data = useRoomData();
  const { activeRoom } = useRoomSession();
  const hasOrders = data.orders.length > 0;

  return (
    <OrdersScreen
      error={data.archiveError}
      loading={!data.archiveHydrated || Boolean(activeRoom && data.loading && !hasOrders)}
      offline={Boolean(activeRoom && data.archiveHydrated && !data.loading && !data.connected)}
      onBack={() => router.back()}
      onOpen={(order) => router.push({ pathname: '/order', params: { ref: order.orderRef } } as never)}
      orders={data.orders}
      refreshing={Boolean(activeRoom && data.loading && hasOrders)}
    />
  );
}

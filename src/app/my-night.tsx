import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';

import { listTickets, type DurableTicket } from '@/access/tickets';
import { useRoomData } from '@/rooms/RoomData';
import { MyNightScreen } from '@/screens/durable/NightAndOrderScreens';
import {
  myNightDoorDestination,
  selectMyNightDoorItem,
} from '@/screens/durable/myNight';
import { useRoomSession } from '@/session/RoomSession';

function useCurrentUnixTime() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Math.floor(Date.now() / 1000));
    const initialTimer = setTimeout(update, 0);
    const refreshTimer = setInterval(update, 60_000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(refreshTimer);
    };
  }, []);

  return now;
}

export default function MyNightRoute() {
  const { activeRoom, hydrated } = useRoomSession();
  const data = useRoomData();
  const now = useCurrentUnixTime();
  const [tickets, setTickets] = useState<DurableTicket[]>([]);

  useEffect(() => {
    let current = true;
    void listTickets()
      .then((items) => {
        if (current) setTickets(items);
      })
      .catch(() => {
        if (current) setTickets([]);
      });
    return () => {
      current = false;
    };
  }, [activeRoom?.id]);

  if (!hydrated || now === null) return null;
  if (!activeRoom) return <Redirect href="/discover" />;

  const order = data.orders.find((item) => !['fulfilled', 'cancelled'].includes(item.status));
  const doorItem = selectMyNightDoorItem({
    entitlements: data.entitlements,
    events: data.events,
    now,
    roomId: activeRoom.id,
    tickets,
  });

  return (
    <MyNightScreen
      doorItem={doorItem}
      membership={data.memberships[0]}
      onBack={() => router.back()}
      onDoorItem={() => {
        if (doorItem) router.push(myNightDoorDestination(doorItem) as never);
      }}
      onMembership={() => router.push('/membership-detail' as never)}
      onOrder={() => router.push({ pathname: '/order', params: { ref: order?.orderRef } } as never)}
      order={order}
      roomName={activeRoom.name}
    />
  );
}

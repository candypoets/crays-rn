import { router, useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';

import { listTickets } from '@/access/tickets';
import { useRoomData } from '@/rooms/RoomData';
import { countUsableEventAccess, hasUsableDurableAccess, MeScreen, selectActiveOrder } from '@/screens/durable/AccountWalletScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function MeRoute() {
  const focused = useIsFocused();
  const data = useRoomData();
  const { activeRoom } = useRoomSession();
  const [ticketCount, setTicketCount] = useState(0);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!focused) return;
    let active = true;
    void listTickets().then((tickets) => {
      if (!active) return;
      setError(null);
      setTicketCount(tickets.length);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Saved tickets could not be read on this device.');
    }).finally(() => {
      if (active) setTicketsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [focused]);

  const activeOrder = selectActiveOrder(data.orders);
  const hasMembership = hasUsableDurableAccess(data.entitlements);
  const durableError = error || data.archiveError;
  const offline = Boolean(activeRoom && data.archiveHydrated && !data.loading && !data.connected);

  return (
    <MeScreen
      activeOrder={activeOrder}
      error={durableError}
      hasMembership={hasMembership}
      loading={!data.archiveHydrated || !ticketsLoaded}
      offline={offline}
      refreshing={Boolean(activeRoom && data.loading)}
      ticketCount={ticketCount + countUsableEventAccess(data.entitlements)}
      roomName={activeRoom?.name}
      onMemberships={() => router.push('/memberships' as never)}
      onMessages={() => router.push('/(tabs)/messages' as never)}
      onOrders={() => router.push('/orders' as never)}
      onProfile={() => router.push('/settings' as never)}
      onRoom={() => router.navigate('/(tabs)/room' as never)}
      onTickets={() => router.push('/tickets' as never)}
      onWallet={() => router.push('/wallet' as never)}
    />
  );
}

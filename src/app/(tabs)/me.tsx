import { router, useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';

import { listTickets } from '@/access/tickets';
import { listInviteRedemptions } from '@/invites/invites';
import { useRoomData } from '@/rooms/RoomData';
import { MeScreen } from '@/screens/durable/AccountWalletScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function MeRoute() {
  const focused = useIsFocused();
  const data = useRoomData();
  const { activeRoom } = useRoomSession();
  const [hasInviteMembership, setHasInviteMembership] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);

  useEffect(() => {
    if (!focused) return;
    let active = true;
    void Promise.all([listInviteRedemptions(), listTickets()]).then(([redemptions, tickets]) => {
      if (!active) return;
      setHasInviteMembership(Boolean(redemptions.length));
      setTicketCount(tickets.length);
    });
    return () => {
      active = false;
    };
  }, [focused]);

  const activeOrder = data.orders.find((item) => !['fulfilled', 'cancelled'].includes(item.status));
  const accessCount = data.entitlements.filter((item) => item.type === 'membership' || item.type === 'pass').length;

  return (
    <MeScreen
      activeOrder={activeOrder}
      hasMembership={hasInviteMembership || accessCount > 0}
      ticketCount={ticketCount + data.entitlements.filter((item) => item.type === 'event_access').length}
      roomName={activeRoom?.name || activeOrder?.roomName}
      onMemberships={() => router.push('/memberships' as never)}
      onOrders={() => router.push('/orders' as never)}
      onProfile={() => router.push('/settings' as never)}
      onTickets={() => router.push('/tickets' as never)}
      onWallet={() => router.push('/wallet' as never)}
    />
  );
}

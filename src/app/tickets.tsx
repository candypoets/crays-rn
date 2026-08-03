import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { listTickets, type DurableTicket } from '@/access/tickets';
import { TicketsScreen } from '@/screens/durable/TicketScreens';
import { useRoomData } from '@/rooms/RoomData';

export default function TicketsRoute() {
  const [tickets, setTickets] = useState<DurableTicket[]>([]);
  const [now] = useState(() => Math.floor(Date.now() / 1000));
  const { entitlements } = useRoomData();
  useEffect(() => { void listTickets().then(setTickets); }, []);
  return <TicketsScreen entitlements={entitlements} now={now} onBack={() => router.canGoBack() ? router.back() : router.replace('/me')} onOpen={(ticket) => router.push({ pathname: '/ticket', params: { id: ticket.id } } as never)} onOpenEntitlement={(item) => router.push({ pathname: '/ticket', params: { awardId: item.awardId } } as never)} tickets={tickets} />;
}

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { listTickets, type DurableTicket } from '@/access/tickets';
import { TicketDetailScreen } from '@/screens/durable/TicketScreens';
import { useRoomData } from '@/rooms/RoomData';

export default function TicketRoute() {
  const { id, awardId } = useLocalSearchParams<{ id?: string; awardId?: string }>();
  const { entitlements } = useRoomData();
  const [ticket, setTicket] = useState<DurableTicket | undefined>();
  useEffect(() => { void listTickets().then((items) => setTicket(items.find((item) => item.id === id))); }, [id]);
  return <TicketDetailScreen entitlement={entitlements.find((item) => item.awardId === awardId && item.type === 'event_access')} onBack={() => router.canGoBack() ? router.back() : router.replace('/tickets')} ticket={ticket} />;
}

import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ensureLocalIdentity } from '@/account/account';
import { findTicket, saveConfirmedRsvp } from '@/access/tickets';
import { publishEvent } from '@/nostr/publish';
import { eventRsvpTemplate } from '@/nostr/protocol';
import { relayUrlFor } from '@/rooms/relayUrl';
import { useRoomData } from '@/rooms/RoomData';
import { EventScreen } from '@/screens/durable/MembershipEventScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function EventRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const data = useRoomData();
  const { activeRoom, hydrated } = useRoomSession();
  const [going, setGoing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const event = data.events.find((item) => item.id === id);
  useEffect(() => { if (event) void findTicket(event.address).then((ticket) => setGoing(Boolean(ticket))); }, [event]);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  const rsvp = async () => {
    if (!event || loading) return;
    setLoading(true); setError(null);
    try {
      await ensureLocalIdentity();
      const relayUrl = relayUrlFor(activeRoom);
      await publishEvent(eventRsvpTemplate(event.address, 'accepted'), [relayUrl], 'event_rsvp');
      await saveConfirmedRsvp({ event, relayUrl, roomId: activeRoom.id, roomName: activeRoom.name });
      setGoing(true);
      if (__DEV__) console.info(`[crays-event-rsvp]${JSON.stringify({ address: event.address, status: 'accepted' })}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The venue did not confirm this RSVP.'); }
    finally { setLoading(false); }
  };
  return <EventScreen error={error} event={event} going={going} loading={loading} onBack={() => router.back()} onRsvp={rsvp} roomName={activeRoom.name} />;
}

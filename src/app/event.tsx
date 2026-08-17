import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { findTicket, saveConfirmedRsvp } from '@/access/tickets';
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
  const stopPublishRef = useRef<(() => void) | null>(null);
  const event = data.events.find((item) => item.id === id);
  useEffect(() => { if (event) void findTicket(event.address).then((ticket) => setGoing(Boolean(ticket))); }, [event]);
  useEffect(() => () => stopPublishRef.current?.(), []);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  const rsvp = () => {
    if (!event || loading) return;
    setLoading(true); setError(null);
    const relayUrl = relayUrlFor(activeRoom);
    let settled = false;
    let stop: () => void = () => undefined;
    const cancel = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      stop();
      stopPublishRef.current = null;
    };
    const fail = (message: string) => {
      if (settled) return;
      cancel();
      setError(message);
      setLoading(false);
    };
    const succeed = async () => {
      if (settled) return;
      cancel();
      try {
        await saveConfirmedRsvp({ event, relayUrl, roomId: activeRoom.id, roomName: activeRoom.name });
        setGoing(true);
        if (__DEV__) console.info(`[crays-event-rsvp]${JSON.stringify({ address: event.address, status: 'accepted' })}`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'The confirmed RSVP could not be saved on this device.');
      } finally {
        setLoading(false);
      }
    };
    const timeout = setTimeout(() => fail('The venue did not confirm this RSVP. Check the connection and try again.'), 12_000);
    try {
      stop = publishToNostr(
        `event_rsvp_${Date.now().toString(36)}`,
        eventRsvpTemplate(event.address, 'accepted'),
        (message: WorkerMessage) => {
          const status = isConnectionStatus(message);
          const value = status?.status()?.toString().toLowerCase() ?? '';
          if (value === 'ok' || value === 'true' || value.startsWith('true ')) void succeed();
          else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) {
            fail(status?.message()?.trim() || 'The venue rejected this RSVP.');
          }
        },
        { trackStatus: true, defaultRelays: [relayUrl] },
      );
      stopPublishRef.current = cancel;
    } catch (cause) {
      clearTimeout(timeout);
      stop();
      stopPublishRef.current = null;
      setError(cause instanceof Error ? cause.message : 'The RSVP could not be started.');
      setLoading(false);
    }
  };
  return <EventScreen error={error} event={event} going={going} loading={loading} onBack={() => router.back()} onRsvp={rsvp} roomName={activeRoom.name} />;
}

import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { loadLocalMessages, type LocalMessage } from '@/messages/store';
import { venueReportTemplate } from '@/nostr/protocol';
import { relayUrlFor } from '@/rooms/relayUrl';
import { useRoomData } from '@/rooms/RoomData';
import { useSafety } from '@/safety/Safety';
import { FirstContactScreen } from '@/screens/room/FirstContactScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function PersonRoute() {
  const { pubkey } = useLocalSearchParams<{ pubkey?: string }>();
  const { activeRoom, hydrated } = useRoomSession();
  const { people } = useRoomData();
  const { block } = useSafety();
  const [contact, setContact] = useState<LocalMessage | null>(null);
  const [reporting, setReporting] = useState(false);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const stopReportPublishRef = useRef<(() => void) | null>(null);
  useEffect(() => { loadLocalMessages().then((messages) => setContact(messages.find((message) => message.recipientPubkey === pubkey) || null)).catch((cause) => setSafetyNotice(cause instanceof Error ? cause.message : 'Saved conversation state could not be read on this device.')); }, [pubkey]);
  useEffect(() => () => stopReportPublishRef.current?.(), []);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  const person = people.find((value) => value.pubkey === pubkey);
  if (!person) return <Redirect href="/room" />;
  const applyBlock = async (scope: 'global' | 'venue') => {
    setSafetyNotice(null);
    try { await block(person.pubkey, scope, scope === 'venue' ? activeRoom.id : undefined, person.name); }
    catch (cause) { setSafetyNotice(cause instanceof Error ? cause.message : 'The block could not be saved on this device.'); }
  };
  const report = () => {
    if (reporting) return;
    setReporting(true);
    setSafetyNotice(null);
    let settled = false;
    let stop: () => void = () => undefined;
    const cancel = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      stop();
      stopReportPublishRef.current = null;
    };
    const finish = (failure?: string) => {
      if (settled) return;
      cancel();
      setSafetyNotice(failure || 'Report sent to this venue.');
      setReporting(false);
    };
    const timeout = setTimeout(() => finish('The venue did not confirm this report. Check the connection and try again.'), 12_000);
    try {
      stop = publishToNostr(
        `profile_report_${Date.now().toString(36)}`,
        venueReportTemplate(person.pubkey, activeRoom.id, 'other'),
        (message: WorkerMessage) => {
          const status = isConnectionStatus(message);
          const value = status?.status()?.toString().toLowerCase() ?? '';
          if (value === 'ok' || value === 'true' || value.startsWith('true ')) finish();
          else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) {
            finish(status?.message()?.trim() || 'The venue rejected this report.');
          }
        },
        { trackStatus: true, defaultRelays: [relayUrlFor(activeRoom)] },
      );
      stopReportPublishRef.current = cancel;
    } catch (cause) {
      clearTimeout(timeout);
      stop();
      setSafetyNotice(cause instanceof Error ? cause.message : 'The venue could not start this report.');
      setReporting(false);
    }
  };
  return (
    <FirstContactScreen
      onBack={() => router.back()}
      contactState={contact?.state === 'requested' || contact?.state === 'accepted' ? contact.state : undefined}
      onBlock={() => void applyBlock('global')}
      onHideInRoom={() => void applyBlock('venue')}
      onMessage={() => router.push({ pathname: contact ? '/conversation' as never : '/message-request' as never, params: { pubkey: person.pubkey } })}
      onReport={report}
      onSendDrink={() => router.push({ pathname: '/gift-select' as never, params: { pubkey: person.pubkey } })}
      person={person}
      reporting={reporting}
      roomName={activeRoom.name}
      safetyNotice={safetyNotice}
    />
  );
}

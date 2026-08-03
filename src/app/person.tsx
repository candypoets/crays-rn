import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { ensureLocalIdentity } from '@/account/account';
import { loadLocalMessages, type LocalMessage } from '@/messages/store';
import { venueReportTemplate } from '@/nostr/protocol';
import { publishEvent } from '@/nostr/publish';
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
  useEffect(() => { loadLocalMessages().then((messages) => setContact(messages.find((message) => message.recipientPubkey === pubkey) || null)); }, [pubkey]);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  const person = people.find((value) => value.pubkey === pubkey);
  if (!person) return <Redirect href="/room" />;
  const applyBlock = async (scope: 'global' | 'venue') => {
    setSafetyNotice(null);
    try { await block(person.pubkey, scope, scope === 'venue' ? activeRoom.id : undefined, person.name); }
    catch (cause) { setSafetyNotice(cause instanceof Error ? cause.message : 'The block could not be saved on this device.'); }
  };
  return (
    <FirstContactScreen
      onBack={() => router.back()}
      contactState={contact?.state === 'requested' || contact?.state === 'accepted' ? contact.state : undefined}
      onBlock={() => void applyBlock('global')}
      onHideInRoom={() => void applyBlock('venue')}
      onMessage={() => router.push({ pathname: contact ? '/conversation' as never : '/message-request' as never, params: { pubkey: person.pubkey } })}
      onReport={() => void (async () => { if (reporting) return; setReporting(true); setSafetyNotice(null); try { await ensureLocalIdentity(); await publishEvent(venueReportTemplate(person.pubkey, activeRoom.id, 'other'), [activeRoom.connectionRelayUrl || activeRoom.relayUrl], 'profile_report'); setSafetyNotice('Report sent to this venue.'); } catch (cause) { setSafetyNotice(cause instanceof Error ? cause.message : 'The venue did not confirm this report.'); } finally { setReporting(false); } })()}
      onSendDrink={() => router.push({ pathname: '/gift-select' as never, params: { pubkey: person.pubkey } })}
      person={person}
      reporting={reporting}
      roomName={activeRoom.name}
      safetyNotice={safetyNotice}
    />
  );
}

import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useState } from 'react';

import { ensureLocalIdentity } from '@/account/account';
import { createNip04MessageTemplate } from '@/messages/nip04';
import { publishEvent } from '@/nostr/publish';
import { relayUrlFor } from '@/rooms/relayUrl';
import { useRoomData } from '@/rooms/RoomData';
import { MessageRequestScreen } from '@/screens/messages/MessageRequestScreen';
import { loadLocalMessages, saveLocalMessage } from '@/messages/store';
import { useRoomSession } from '@/session/RoomSession';
import { useSafety } from '@/safety/Safety';

export default function MessageRequestRoute() {
  const { pubkey } = useLocalSearchParams<{ pubkey?: string }>();
  const { activeRoom, hydrated } = useRoomSession();
  const { people } = useRoomData();
  const { isBlocked } = useSafety();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  const person = people.find((value) => value.pubkey === pubkey);
  if (!person) return <Redirect href="/room" />;

  const send = async () => {
    const plaintext = message.trim();
    if (!plaintext || sending) return;
    setSending(true);
    setError(null);
    try {
      if (isBlocked(person.pubkey, activeRoom.id)) throw new Error('This person is blocked. Unblock them in Privacy & safety before contacting them.');
      const existing = (await loadLocalMessages()).find((item) => item.recipientPubkey === person.pubkey);
      if (existing?.state === 'requested' || existing?.state === 'ignored') throw new Error('A request is already waiting. You cannot send another one.');
      if (existing?.state === 'accepted') { router.replace({ pathname: '/conversation', params: { pubkey: person.pubkey } } as never); return; }
      await ensureLocalIdentity();
      const messageId = Crypto.randomUUID();
      const relayUrl = relayUrlFor(activeRoom);
      const { template } = createNip04MessageTemplate({ messageId, messageType: 'message-request', recipientPubkey: person.pubkey, roomId: activeRoom.id, roomName: activeRoom.name, text: plaintext });
      await publishEvent(template, [relayUrl], 'nip04_message_request');
      await saveLocalMessage({
        id: messageId,
        recipientPubkey: person.pubkey,
        recipientName: person.name,
        roomId: activeRoom.id,
        roomName: activeRoom.name,
        content: plaintext,
        createdAt: Date.now(),
        state: 'requested',
        direction: 'outgoing',
        protocol: 'nip04',
        relayUrls: [relayUrl],
      });
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The request could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return <MessageRequestScreen error={error} message={message} onBack={() => router.back()} onChangeMessage={setMessage} onSend={send} person={person} sending={sending} sent={sent} />;
}

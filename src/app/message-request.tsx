import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useEffect, useRef, useState } from 'react';

import { createNip04MessageTemplate } from '@/messages/nip04';
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
  const stopPublishRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopPublishRef.current?.(), []);
  useEffect(() => {
    if (!hydrated || !pubkey) return;
    let live = true;
    loadLocalMessages().then((messages) => {
      if (!live) return;
      const existing = messages.find((item) => item.recipientPubkey === pubkey);
      if (existing?.state === 'accepted') router.replace({ pathname: '/conversation', params: { pubkey } } as never);
      else if (existing?.state === 'requested' && existing.direction !== 'incoming') setSent(true);
    }).catch((cause) => {
      if (live) setError(cause instanceof Error ? cause.message : 'Saved request state could not be read on this device.');
    });
    return () => { live = false; };
  }, [hydrated, pubkey]);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  const person = people.find((value) => value.pubkey === pubkey);
  if (!person) return <Redirect href="/room" />;

  const send = async () => {
    const plaintext = message.trim();
    if (!plaintext || sending) return;
    setSending(true);
    setError(null);
    let cancelActivePublish: (() => void) | null = null;
    try {
      if (isBlocked(person.pubkey, activeRoom.id)) throw new Error('This person is blocked. Unblock them in Privacy & safety before contacting them.');
      const existing = (await loadLocalMessages()).find((item) => item.recipientPubkey === person.pubkey);
      if (existing?.state === 'requested' || existing?.state === 'ignored') throw new Error('A request is already waiting. You cannot send another one.');
      if (existing?.state === 'accepted') { router.replace({ pathname: '/conversation', params: { pubkey: person.pubkey } } as never); return; }
      const messageId = Crypto.randomUUID();
      const relayUrl = relayUrlFor(activeRoom);
      const { template } = createNip04MessageTemplate({ messageId, messageType: 'message-request', recipientPubkey: person.pubkey, roomId: activeRoom.id, roomName: activeRoom.name, text: plaintext });
      let settled = false;
      let stop: () => void = () => undefined;
      const cancel = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        stop();
        stopPublishRef.current = null;
      };
      cancelActivePublish = cancel;
      const fail = (failure: string) => {
        if (settled) return;
        cancel();
        setError(failure);
        setSending(false);
      };
      const succeed = async () => {
        if (settled) return;
        cancel();
        try {
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
          setError(cause instanceof Error ? cause.message : 'The confirmed request could not be saved on this device.');
        } finally {
          setSending(false);
        }
      };
      const timeout = setTimeout(() => fail('The direct-message relay did not confirm this request. Check the connection and try again.'), 12_000);
      stop = publishToNostr(
        `nip04_message_request_${Date.now().toString(36)}`,
        template,
        (workerMessage: WorkerMessage) => {
          const status = isConnectionStatus(workerMessage);
          const value = status?.status()?.toString().toLowerCase() ?? '';
          if (value === 'ok' || value === 'true' || value.startsWith('true ')) void succeed();
          else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) {
            fail(status?.message()?.trim() || 'The direct-message relay rejected this request.');
          }
        },
        { trackStatus: true, defaultRelays: [relayUrl] },
      );
      stopPublishRef.current = cancel;
    } catch (cause) {
      cancelActivePublish?.();
      setError(cause instanceof Error ? cause.message : 'The request could not be sent.');
      setSending(false);
    }
  };

  return <MessageRequestScreen error={error} message={message} onBack={() => router.back()} onChangeMessage={setMessage} onMessages={() => router.replace('/messages' as never)} onSend={send} person={person} roomName={activeRoom.name} sending={sending} sent={sent} />;
}

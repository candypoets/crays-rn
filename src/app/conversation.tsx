import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import { createNip04MessageTemplate } from '@/messages/nip04';
import { conversationMessages, loadLocalMessages, saveLocalMessage, updateLocalConversation, type LocalMessage } from '@/messages/store';
import { venueReportTemplate } from '@/nostr/protocol';
import { relayUrlFor } from '@/rooms/relayUrl';
import { ConversationScreen } from '@/screens/messages/MessagesScreens';
import { useRoomSession } from '@/session/RoomSession';
import { useSafety } from '@/safety/Safety';

export default function ConversationRoute() {
  const { pubkey } = useLocalSearchParams<{ pubkey?: string }>();
  const { activeRoom } = useRoomSession();
  const { block, isBlocked } = useSafety();
  const [message, setMessage] = useState<LocalMessage | null>(null);
  const [thread, setThread] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const stopDeliveryPublishRef = useRef<(() => void) | null>(null);
  const stopReportPublishRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    loadLocalMessages().then((items) => {
      const messages = pubkey ? conversationMessages(items, pubkey) : [];
      setThread(messages);
      setMessage(messages.at(-1) || null);
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : 'Saved conversations could not be read on this device.');
    }).finally(() => setLoaded(true));
  }, [pubkey]);
  useEffect(() => () => {
    stopDeliveryPublishRef.current?.();
    stopReportPublishRef.current?.();
  }, []);

  const deliver = (messageType: 'message-acceptance' | 'message', content: string) => {
    if (!message || sending) return;
    setSending(true); setError(null);
    let cancelActivePublish: (() => void) | null = null;
    try {
      if (isBlocked(message.recipientPubkey, message.roomId)) throw new Error('This person is blocked. No direct message was sent.');
      const relays = Array.from(new Set(message.relayUrls?.length ? message.relayUrls : activeRoom ? [relayUrlFor(activeRoom)] : []));
      if (!relays.length) throw new Error('No saved direct-message relay is available for this conversation.');
      const messageId = Crypto.randomUUID();
      const { template } = createNip04MessageTemplate({ messageId, messageType, recipientPubkey: message.recipientPubkey, replyTo: message.id, roomId: message.roomId, roomName: message.roomName, text: content });
      const failedRelays = new Map<string, string>();
      let settled = false;
      let stop: () => void = () => undefined;
      const cancel = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        stop();
        stopDeliveryPublishRef.current = null;
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
          const next: LocalMessage = { ...message, id: messageId, content, createdAt: Date.now(), state: 'accepted', direction: 'outgoing', protocol: 'nip04', relayUrls: relays };
          await saveLocalMessage(next);
          const messages = conversationMessages(await loadLocalMessages(), message.recipientPubkey);
          setThread(messages);
          setMessage(messages.at(-1) || next);
          setDraft('');
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'The confirmed message could not be saved on this device.');
        } finally {
          setSending(false);
        }
      };
      const timeout = setTimeout(() => fail('The direct-message relay did not confirm this action. Check the connection and try again.'), 12_000);
      stop = publishToNostr(
        `nip04_${messageType}_${Date.now().toString(36)}`,
        template,
        (workerMessage: WorkerMessage) => {
          const status = isConnectionStatus(workerMessage);
          const value = status?.status()?.toString().toLowerCase() ?? '';
          if (value === 'ok' || value === 'true' || value.startsWith('true ')) void succeed();
          else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) {
            const relayUrl = status?.relayUrl()?.trim() || `unknown-${failedRelays.size}`;
            failedRelays.set(relayUrl, status?.message()?.trim() || 'The direct-message relay rejected this action.');
            if (failedRelays.size >= relays.length) fail(Array.from(failedRelays.values()).at(-1)!);
          }
        },
        { trackStatus: true, defaultRelays: relays },
      );
      stopDeliveryPublishRef.current = cancel;
    } catch (cause) {
      cancelActivePublish?.();
      setError(cause instanceof Error ? cause.message : 'The direct-message action could not be started.');
      setSending(false);
    }
  };
  const change = async (state: LocalMessage['state']) => { if (!message) return; if (state === 'accepted' && message.direction === 'incoming') { deliver('message-acceptance', 'Conversation accepted'); return; } await updateLocalConversation(message.recipientPubkey, state); const messages = conversationMessages(await loadLocalMessages(), message.recipientPubkey); setThread(messages); setMessage(messages.at(-1) || { ...message, state }); };
  const blockPerson = async () => { if (!message) return; setError(null); try { await block(message.recipientPubkey, 'global', undefined, message.recipientName); await change('blocked'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'The block could not be saved on this device.'); } };
  const report = () => {
    if (!message) return;
    const relays = Array.from(new Set(message.relayUrls?.length ? message.relayUrls : activeRoom ? [relayUrlFor(activeRoom)] : []));
    if (!relays.length) { setError('No saved venue relay is available for this report.'); return; }
    setError(null);
    const failedRelays = new Map<string, string>();
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
      if (failure) setError(failure);
      else if (__DEV__) console.info(`[crays-venue-report]${JSON.stringify({ pubkey: message.recipientPubkey, roomId: message.roomId })}`);
    };
    const timeout = setTimeout(() => finish('The venue did not confirm this report. Check the connection and try again.'), 12_000);
    try {
      stop = publishToNostr(
        `venue_report_${Date.now().toString(36)}`,
        venueReportTemplate(message.recipientPubkey, message.roomId),
        (workerMessage: WorkerMessage) => {
          const status = isConnectionStatus(workerMessage);
          const value = status?.status()?.toString().toLowerCase() ?? '';
          if (value === 'ok' || value === 'true' || value.startsWith('true ')) finish();
          else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) {
            const relayUrl = status?.relayUrl()?.trim() || `unknown-${failedRelays.size}`;
            failedRelays.set(relayUrl, status?.message()?.trim() || 'The venue rejected this report.');
            if (failedRelays.size >= relays.length) finish(Array.from(failedRelays.values()).at(-1)!);
          }
        },
        { trackStatus: true, defaultRelays: relays },
      );
      stopReportPublishRef.current = cancel;
    } catch (cause) {
      clearTimeout(timeout);
      stop();
      setError(cause instanceof Error ? cause.message : 'The venue report could not be started.');
    }
  };
  if (!message) {
    if (!loaded) return <View className="flex-1 items-center justify-center bg-base-100"><ActivityIndicator /><Text className="mt-3 text-muted">Opening conversation…</Text></View>;
    return <View className="flex-1 justify-center bg-base-100 px-7" testID="conversation-not-found"><Text accessibilityRole="header" className="text-2xl font-black text-base-content">Conversation not found</Text><Text className="mt-3 leading-6 text-muted">{error || 'No saved conversation matches this person on this device.'}</Text><View className="mt-7"><PrimaryButton label="Back to Messages" onPress={() => router.back()} /></View></View>;
  }
  return <ConversationScreen draft={draft} error={error} message={message} onAccept={() => void change('accepted')} onBack={() => router.back()} onBlock={() => void blockPerson()} onChangeDraft={setDraft} onNotNow={() => void change('ignored')} onReply={() => void deliver('message', draft.trim())} onReport={() => void report()} sending={sending} thread={thread} />;
}

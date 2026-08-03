import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ensureLocalIdentity } from '@/account/account';
import { PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import { createNip04MessageTemplate } from '@/messages/nip04';
import { conversationMessages, loadLocalMessages, saveLocalMessage, updateLocalConversation, type LocalMessage } from '@/messages/store';
import { publishEvent } from '@/nostr/publish';
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
  useEffect(() => {
    loadLocalMessages().then((items) => {
      const messages = pubkey ? conversationMessages(items, pubkey) : [];
      setThread(messages);
      setMessage(messages.at(-1) || null);
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : 'Saved conversations could not be read on this device.');
    }).finally(() => setLoaded(true));
  }, [pubkey]);

  const deliver = async (messageType: 'message-acceptance' | 'message', content: string) => {
    if (!message || sending) return;
    setSending(true); setError(null);
    try {
      await ensureLocalIdentity();
      if (isBlocked(message.recipientPubkey, message.roomId)) throw new Error('This person is blocked. No direct message was sent.');
      const relays = Array.from(new Set(message.relayUrls?.length ? message.relayUrls : activeRoom ? [relayUrlFor(activeRoom)] : []));
      if (!relays.length) throw new Error('No saved direct-message relay is available for this conversation.');
      const messageId = Crypto.randomUUID();
      const { template } = createNip04MessageTemplate({ messageId, messageType, recipientPubkey: message.recipientPubkey, replyTo: message.id, roomId: message.roomId, roomName: message.roomName, text: content });
      await publishEvent(template, relays, `nip04_${messageType}`);
      const next: LocalMessage = { ...message, id: messageId, content, createdAt: Date.now(), state: 'accepted', direction: 'outgoing', protocol: 'nip04', relayUrls: relays };
      await saveLocalMessage(next);
      const messages = conversationMessages(await loadLocalMessages(), message.recipientPubkey);
      setThread(messages);
      setMessage(messages.at(-1) || next);
      setDraft('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The direct-message relay did not confirm this action.'); }
    finally { setSending(false); }
  };
  const change = async (state: LocalMessage['state']) => { if (!message) return; if (state === 'accepted' && message.direction === 'incoming') { await deliver('message-acceptance', 'Conversation accepted'); return; } await updateLocalConversation(message.recipientPubkey, state); const messages = conversationMessages(await loadLocalMessages(), message.recipientPubkey); setThread(messages); setMessage(messages.at(-1) || { ...message, state }); };
  const blockPerson = async () => { if (!message) return; setError(null); try { await block(message.recipientPubkey, 'global', undefined, message.recipientName); await change('blocked'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'The block could not be saved on this device.'); } };
  const report = async () => { if (!message) return; const relays = message.relayUrls?.length ? message.relayUrls : activeRoom ? [relayUrlFor(activeRoom)] : []; if (!relays.length) { setError('No saved venue relay is available for this report.'); return; } setError(null); try { await ensureLocalIdentity(); await publishEvent(venueReportTemplate(message.recipientPubkey, message.roomId), relays, 'venue_report'); if (__DEV__) console.info(`[crays-venue-report]${JSON.stringify({ pubkey: message.recipientPubkey, roomId: message.roomId })}`); } catch (cause) { setError(cause instanceof Error ? cause.message : 'The venue did not confirm this report.'); } };
  if (!message) {
    if (!loaded) return <View className="flex-1 items-center justify-center bg-base-100"><ActivityIndicator /><Text className="mt-3 text-muted">Opening conversation…</Text></View>;
    return <View className="flex-1 justify-center bg-base-100 px-7" testID="conversation-not-found"><Text accessibilityRole="header" className="text-2xl font-black text-base-content">Conversation not found</Text><Text className="mt-3 leading-6 text-muted">{error || 'No saved conversation matches this person on this device.'}</Text><View className="mt-7"><PrimaryButton label="Back to Messages" onPress={() => router.back()} /></View></View>;
  }
  return <ConversationScreen draft={draft} error={error} message={message} onAccept={() => void change('accepted')} onBack={() => router.back()} onBlock={() => void blockPerson()} onChangeDraft={setDraft} onNotNow={() => void change('ignored')} onReply={() => void deliver('message', draft.trim())} onReport={() => void report()} sending={sending} thread={thread} />;
}

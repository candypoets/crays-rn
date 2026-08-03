import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { ensureLocalIdentity } from '@/account/account';
import { parseCraysDirectMessage } from '@/messages/nip04';
import { loadMessageRelays, saveMessageRelays } from '@/messages/relays';
import { latestConversationMessages, loadLocalMessages, saveLocalMessage, type LocalMessage } from '@/messages/store';
import { subscribeNip04Messages } from '@/messages/subscription';
import { relayUrlFor } from '@/rooms/relayUrl';
import { useRoomData } from '@/rooms/RoomData';
import { MessagesScreen } from '@/screens/messages/MessagesScreens';
import { useRoomSession } from '@/session/RoomSession';
import { useSafety } from '@/safety/Safety';

export default function MessagesRoute() {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { profiles } = useRoomData();
  const { activeRoom } = useRoomSession();
  const { isBlocked } = useSafety();
  const profilesRef = useRef(profiles);
  const activeRelay = activeRoom ? relayUrlFor(activeRoom) : null;

  useEffect(() => { profilesRef.current = profiles; }, [profiles]);

  useEffect(() => {
    let stopped = false;
    let unsubscribe: () => void = () => undefined;
    void (async () => {
      const identity = await ensureLocalIdentity();
      const stored = await loadLocalMessages();
      if (stopped) return;
      setMessages(stored);
      const archivedRelays = await loadMessageRelays(identity.pubkey);
      const relays = Array.from(new Set([
        ...(activeRelay ? [activeRelay] : []),
        ...archivedRelays,
        ...stored.flatMap((message) => message.relayUrls || []),
      ]));
      if (activeRelay) await saveMessageRelays(identity.pubkey, relays);
      if (stopped) return;
      unsubscribe = subscribeNip04Messages({
        pubkey: identity.pubkey,
        relays,
        onEvent: (event) => {
          const envelope = parseCraysDirectMessage(event.plaintext);
          if (!envelope) return;
          const peerPubkey = event.senderPubkey === identity.pubkey ? event.recipientPubkey : event.senderPubkey;
          if (peerPubkey === identity.pubkey) return;
          void (async () => {
            const current = (await loadLocalMessages()).find((item) => item.recipientPubkey === peerPubkey);
            if (current?.state === 'blocked' || isBlocked(peerPubkey, envelope.roomId)) return;
            const incoming = event.senderPubkey !== identity.pubkey;
            const requested = envelope.messageType === 'message-request';
            if (incoming && requested && current?.state === 'ignored') return;
            const next: LocalMessage = {
              id: envelope.messageId,
              recipientPubkey: peerPubkey,
              recipientName: profilesRef.current.get(peerPubkey)?.name || current?.recipientName || `Person ${peerPubkey.slice(0, 8)}`,
              roomId: envelope.roomId,
              roomName: envelope.roomName,
              content: envelope.text,
              createdAt: event.createdAt * 1000,
              state: requested ? 'requested' : 'accepted',
              direction: incoming ? 'incoming' : 'outgoing',
              protocol: 'nip04',
              relayUrls: relays,
            };
            await saveLocalMessage(next);
            if (!stopped) setMessages(await loadLocalMessages());
          })();
        },
      });
    })().catch((cause) => { if (!stopped) setError(cause instanceof Error ? cause.message : 'The direct-message relay is unavailable. Saved conversations remain readable.'); });
    return () => { stopped = true; unsubscribe(); };
  }, [activeRelay, isBlocked]);

  const visibleConversations = latestConversationMessages(messages.filter((message) => !isBlocked(message.recipientPubkey, message.roomId)));
  return <MessagesScreen error={error} messages={visibleConversations} onOpen={(message) => router.push({ pathname: '/conversation', params: { pubkey: message.recipientPubkey } } as never)} />;
}

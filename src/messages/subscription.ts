import type { Kind4Parsed, WorkerMessage } from '@candypoets/nipworker';
import { useSubscription as subscribeToNostr } from '@candypoets/nipworker/hooks';
import { asKind4, asParsedEvent } from '@candypoets/nipworker/utils';

export type DecryptedKind4Message = {
  eventId: string;
  senderPubkey: string;
  recipientPubkey: string;
  createdAt: number;
  plaintext: string;
};

export function subscribeNip04Messages({ onEvent, pubkey, relays }: {
  onEvent: (message: DecryptedKind4Message) => void;
  pubkey: string;
  relays: string[];
}): () => void {
  const seen = new Set<string>();
  const safeRelays = Array.from(new Set(relays.filter((relay) => /^wss?:\/\//.test(relay))));
  if (!safeRelays.length) return () => undefined;
  const handleMessage = (workerMessage: WorkerMessage) => {
      const event = asParsedEvent(workerMessage);
      if (!event || event.kind() !== 4) return;
      const eventId = event.id() || '';
      if (!eventId || seen.has(eventId)) return;
      const kind4 = asKind4(event) as Kind4Parsed | null;
      const plaintext = kind4?.decryptedContent();
      const senderPubkey = event.pubkey() || '';
      const recipientPubkey = kind4?.recipient() || '';
      if (typeof plaintext !== 'string' || !plaintext || !/^[0-9a-f]{64}$/i.test(senderPubkey) || !/^[0-9a-f]{64}$/i.test(recipientPubkey)) return;
      if (senderPubkey !== pubkey && recipientPubkey !== pubkey) return;
      seen.add(eventId);
      onEvent({ eventId, senderPubkey, recipientPubkey, createdAt: event.createdAt(), plaintext });
  };
  const unsubscribeIncoming = subscribeToNostr(
    `crays_kind4_in_${pubkey.slice(0, 12)}`,
    [{ kinds: [4], tags: { '#p': [pubkey] }, relays: safeRelays, limit: 200, noCache: true }],
    handleMessage,
  );
  const unsubscribeOutgoing = subscribeToNostr(
    `crays_kind4_out_${pubkey.slice(0, 12)}`,
    [{ kinds: [4], authors: [pubkey], relays: safeRelays, limit: 200, noCache: true }],
    handleMessage,
  );
  return () => { unsubscribeIncoming(); unsubscribeOutgoing(); };
}

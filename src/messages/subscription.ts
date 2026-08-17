import type { Kind4Parsed, WorkerMessage } from '@candypoets/nipworker';
import { isConnectionStatus, useSubscription as subscribeToNostr } from '@candypoets/nipworker/hooks';
import { asKind4, asParsedEvent } from '@candypoets/nipworker/utils';

export type DecryptedKind4Message = {
  eventId: string;
  senderPubkey: string;
  recipientPubkey: string;
  createdAt: number;
  plaintext: string;
};

function normalizedRelay(relay: string): string {
  try {
    const parsed = new URL(relay);
    parsed.hash = '';
    parsed.search = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return relay.replace(/\/+$/, '');
  }
}

function relayScope(relays: string[]): string {
  // A compact deterministic FNV-1a suffix keeps concurrent relay result sets
  // from replacing one another while preserving a stable id for ref-counted
  // consumers of the same encrypted-message lease.
  let hash = 0x811c9dc5;
  for (const character of relays.slice().sort().join('\u0000')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function subscribeNip04Messages({ onEvent, onReady, pubkey, relays }: {
  onEvent: (message: DecryptedKind4Message) => void;
  onReady?: () => void;
  pubkey: string;
  relays: string[];
}): () => void {
  const seen = new Set<string>();
  const safeRelays = Array.from(new Set(relays.filter((relay) => /^wss?:\/\//.test(relay))));
  if (!safeRelays.length) return () => undefined;
  const expectedRelays = new Set(safeRelays.map(normalizedRelay));
  const readyRelays = new Set<string>();
  const subScope = `${pubkey.slice(0, 12)}_${relayScope(safeRelays)}`;
  let ready = false;
  let unsubscribeOutgoing: () => void = () => undefined;
  const handleEvent = (workerMessage: WorkerMessage) => {
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
  const openOutgoing = () => {
    if (ready) return;
    ready = true;
    unsubscribeOutgoing = subscribeToNostr(
      `crays_kind4_out_${subScope}`,
      [{ kinds: [4], authors: [pubkey], relays: safeRelays, limit: 200, noCache: true }],
      handleEvent,
    );
    onReady?.();
  };
  const unsubscribeIncoming = subscribeToNostr(
    `crays_kind4_in_${subScope}`,
    [{ kinds: [4], tags: { '#p': [pubkey] }, relays: safeRelays, limit: 200, noCache: true }],
    (workerMessage) => {
      // Cache EOSE only marks the end of nipworker's local phase. A relay URL
      // on ConnectionStatus("EOSE") is the network acknowledgement proving
      // the NIP-42 challenge was signed and the private REQ was replayed.
      const status = isConnectionStatus(workerMessage);
      const relayUrl = status?.relayUrl();
      if (status?.status() === 'EOSE' && relayUrl) {
        readyRelays.add(normalizedRelay(relayUrl));
        if (Array.from(expectedRelays).every((relay) => readyRelays.has(relay))) openOutgoing();
        return;
      }
      handleEvent(workerMessage);
    },
  );
  return () => { unsubscribeIncoming(); unsubscribeOutgoing(); };
}

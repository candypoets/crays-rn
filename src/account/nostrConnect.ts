import * as Crypto from 'expo-crypto';
import { getPublicKey } from 'nostr-tools';

export type NostrConnectRequest = {
  clientSecret: string;
  url: string;
};

export const CRAYS_NIP46_PERMISSIONS = [
  'nip04_encrypt',
  'nip04_decrypt',
  'sign_event:0',
  'sign_event:1',
  'sign_event:4',
  'sign_event:5',
  'sign_event:10312',
  'sign_event:1984',
  'sign_event:27235',
  'sign_event:27236',
  'sign_event:31925',
] as const;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function generateClientKey(): Promise<{ pubkey: string; secret: string }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const bytes = await Crypto.getRandomBytesAsync(32);
    try {
      return { pubkey: getPublicKey(bytes), secret: bytesToHex(bytes) };
    } catch {
      // An invalid secp256k1 scalar is vanishingly unlikely; use fresh secure
      // randomness rather than trying to massage it into range.
    }
  }
  throw new Error('Crays could not create a secure signer connection. Please try again.');
}

export function normalizeNip46Relays(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => {
    try {
      return /^wss?:$/.test(new URL(value).protocol);
    } catch {
      return false;
    }
  })));
}

export async function createNostrConnectRequest(
  appName: string,
  relayValues: readonly string[],
): Promise<NostrConnectRequest> {
  const relays = normalizeNip46Relays(relayValues);
  if (!relays.length) throw new Error('No Nostr Connect relay is configured for this build.');
  const client = await generateClientKey();
  const challenge = bytesToHex(await Crypto.getRandomBytesAsync(32));
  const query = [
    ...relays.map((relay) => `relay=${encodeURIComponent(relay)}`),
    `secret=${encodeURIComponent(challenge)}`,
    `name=${encodeURIComponent(appName.trim() || 'Crays')}`,
    `perms=${encodeURIComponent(CRAYS_NIP46_PERMISSIONS.join(','))}`,
  ].join('&');
  return {
    clientSecret: client.secret,
    url: `nostrconnect://${client.pubkey}?${query}`,
  };
}

export async function createBunkerConnection(bunkerInput: string): Promise<NostrConnectRequest> {
  const url = bunkerInput.trim();
  try {
    const parsed = new URL(url);
    const pubkey = parsed.hostname || parsed.pathname.replace(/^\/+/, '');
    const relays = parsed.searchParams.getAll('relay');
    if (
      parsed.protocol !== 'bunker:' ||
      !/^[0-9a-f]{64}$/i.test(pubkey) ||
      normalizeNip46Relays(relays).length !== relays.length ||
      relays.length === 0
    ) {
      throw new Error('invalid');
    }
  } catch {
    throw new Error('Paste a valid bunker:// link from your Nostr signer.');
  }
  const client = await generateClientKey();
  return { clientSecret: client.secret, url };
}

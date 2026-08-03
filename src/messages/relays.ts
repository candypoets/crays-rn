import * as SecureStore from 'expo-secure-store';

const RELAYS_KEY = 'crays.messages.relays.v1';

export async function saveMessageRelays(pubkey: string, relays: string[]): Promise<void> {
  if (!/^[0-9a-f]{64}$/i.test(pubkey)) return;
  const previous = await loadMessageRelays(pubkey);
  const safe = Array.from(new Set([...relays, ...previous].filter((relay) => /^wss?:\/\//.test(relay)))).slice(0, 8);
  if (!safe.length) return;
  await SecureStore.setItemAsync(RELAYS_KEY, JSON.stringify({ pubkey, relays: safe }));
}

export async function loadMessageRelays(pubkey: string): Promise<string[]> {
  try {
    const value = JSON.parse((await SecureStore.getItemAsync(RELAYS_KEY)) || '{}') as { pubkey?: string; relays?: unknown[] };
    if (value.pubkey !== pubkey || !Array.isArray(value.relays)) return [];
    return value.relays.filter((relay): relay is string => typeof relay === 'string' && /^wss?:\/\//.test(relay)).slice(0, 8);
  } catch { return []; }
}

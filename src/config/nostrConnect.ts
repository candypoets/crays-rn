import { normalizeNip46Relays } from '@/account/nostrConnect';

const configured = process.env.EXPO_PUBLIC_CRAYS_NIP46_RELAYS
  ?.split(',')
  .map((relay: string) => relay.trim())
  .filter(Boolean) ?? [];

/**
 * NIP-46 discovery transport. Operators can replace this comma-separated
 * list at build time; signer links still carry their own chosen relays.
 */
export const NOSTR_CONNECT_RELAYS = normalizeNip46Relays(
  configured.length ? configured : ['wss://relay.nsec.app'],
);

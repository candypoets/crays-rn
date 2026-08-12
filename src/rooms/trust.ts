import type { CommunityAnchor } from '@/access/nip97';

/**
 * NIP-97 trust resolution for one room relay. The only out-of-band fact is
 * the relay's NIP-11 `pubkey` (the community root key); the root-signed
 * anchor event declares admins and the delegated badge issuer. Everything
 * entitlement-related is verified against this set, pinned to the room relay.
 */
export type CommunityTrust = {
  rootPubkey: string;
  admins: ReadonlySet<string>;
  badgeIssuer?: string;
};

export function trustFromAnchor(anchor: CommunityAnchor): CommunityTrust {
  return {
    rootPubkey: anchor.pubkey,
    admins: new Set(anchor.admins),
    ...(anchor.badgeIssuer ? { badgeIssuer: anchor.badgeIssuer } : {}),
  };
}

export function nip11UrlForRelay(relayUrl: string): string {
  const url = new URL(relayUrl);
  if (url.protocol === 'ws:') url.protocol = 'http:';
  else if (url.protocol === 'wss:') url.protocol = 'https:';
  else throw new Error('The venue relay address is invalid.');
  return url.toString();
}

export function parseNip11RootPubkey(document: unknown): string | undefined {
  const pubkey = (document as { pubkey?: unknown })?.pubkey;
  return typeof pubkey === 'string' && /^[0-9a-f]{64}$/i.test(pubkey) ? pubkey : undefined;
}

export async function fetchRelayRootPubkey(
  relayUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(nip11UrlForRelay(relayUrl), {
    headers: { accept: 'application/nostr+json' },
  });
  if (!response.ok) throw new Error('The venue relay did not identify itself.');
  const pubkey = parseNip11RootPubkey(await response.json().catch(() => ({})));
  if (!pubkey) throw new Error('The venue relay did not publish its community key.');
  return pubkey;
}

export async function fetchRelayRootPubkeyWithRetry(
  relayUrl: string,
  options: {
    attempts?: number;
    delayMs?: number;
    fetchImpl?: typeof fetch;
    sleepImpl?: (milliseconds: number) => Promise<void>;
  } = {},
): Promise<string> {
  const attempts = Math.max(1, options.attempts ?? 4);
  const delayMs = Math.max(0, options.delayMs ?? 500);
  const sleepImpl = options.sleepImpl ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchRelayRootPubkey(relayUrl, options.fetchImpl);
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await sleepImpl(delayMs * (2 ** attempt));
    }
  }
  throw lastError;
}

/**
 * Award issuance rule: an anchor admin may award any definition; the
 * delegated badge issuer may award sellable (priced) definitions only.
 */
export function awardIssuerValid({
  issuer,
  sellable,
  trust,
}: {
  issuer: string;
  sellable: boolean;
  trust: CommunityTrust;
}): boolean {
  if (trust.admins.has(issuer)) return true;
  return sellable && trust.badgeIssuer === issuer;
}

/**
 * Fulfillment-status signers: anchor admins or the badge issuer. The relay
 * write gate additionally enforces 37237-write role holders, so anything read
 * back from the pinned community relay already passed the full rule.
 */
export function statusSignerValid(signer: string, trust: CommunityTrust): boolean {
  return trust.admins.has(signer) || trust.badgeIssuer === signer;
}

/** Award revocation: the award's own issuer or an anchor admin. */
export function revocationSignerValid(deleter: string, awardIssuer: string, trust: CommunityTrust): boolean {
  return deleter === awardIssuer || trust.admins.has(deleter);
}

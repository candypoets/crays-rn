import * as SecureStore from 'expo-secure-store';

const REDEMPTIONS_KEY = 'crays.invites.redemptions.v1';

export type InviteClaims = {
  v: 1;
  nonce: string;
  badge: string;
  exp: number;
  badge_exp?: number;
  max: number;
};

export type CommunityInfo = {
  badge_issuer: string;
  relay_url: string;
  required_badge: string;
};

// A preview is a *decoded* invite, never a verified one. The issuer contract
// (strfry-badge-node/crates/invite, mirroring nuts-cash) signs tokens as
// HMAC-SHA256 over the base64url claims with a server-only INVITE_SECRET; the
// secret is not exposed by /community/info or any other endpoint, so the
// client cannot verify the signature. Only the /redeem round trip — which
// re-verifies the HMAC and republishes a kind 8 award signed by the published
// badge_issuer — proves an invite is genuine.
export type InvitePreview = {
  claims: InviteClaims;
  community: CommunityInfo;
  serviceUrl: string;
};
export type InviteHandoff = {
  serviceUrl: string;
  token: string;
};

export type InviteRedemption = {
  eventId: string;
  nonce: string;
  pubkey: string;
  redeemedAt: number;
  badgeAddress?: string;
  serviceUrl?: string;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  if (typeof globalThis.atob !== 'function') throw new Error('Invite decoding is unavailable on this device.');
  return globalThis.atob(padded);
}

/**
 * Decodes and structurally validates invite claims. This is deliberately NOT
 * signature verification: the token signature is HMAC-SHA256 keyed by the
 * issuer's server-only INVITE_SECRET (see InvitePreview), which the client
 * cannot know. Tampered nonce/badge/max claims therefore pass this check; they
 * are only rejected by the issuer at /redeem time. Preview copy must not claim
 * the invite is "verified" before redemption succeeds.
 */
export function decodeInviteToken(token: string, now = Math.floor(Date.now() / 1000)): InviteClaims {
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error('This invite link is incomplete.');
  let claims: unknown;
  try {
    claims = JSON.parse(decodeBase64Url(parts[0]));
  } catch {
    throw new Error('This invite link is malformed.');
  }
  const value = claims as Partial<InviteClaims>;
  if (
    value.v !== 1 ||
    typeof value.nonce !== 'string' || !value.nonce ||
    typeof value.badge !== 'string' || !/^30009:[0-9a-f]{64}:.+/i.test(value.badge) ||
    !Number.isSafeInteger(value.exp) ||
    !Number.isSafeInteger(value.max) || Number(value.max) < 1 ||
    (value.badge_exp !== undefined && !Number.isSafeInteger(value.badge_exp))
  ) throw new Error('This invite uses unsupported or unsafe details.');
  if (Number(value.exp) < now) throw new Error('This invite has expired. Ask the venue for a new link.');
  return value as InviteClaims;
}

function normalizedServiceUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('The invite service address is invalid.');
  return url.toString().replace(/\/$/, '');
}

export async function fetchInviteHandoff(urlInput: string): Promise<InviteHandoff> {
  const url = normalizedServiceUrl(urlInput);
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  const data = await response.json().catch(() => ({})) as { service_url?: string; token?: string };
  if (!response.ok || typeof data.token !== 'string' || !data.token.includes('.') || typeof data.service_url !== 'string') {
    throw new Error('The room could not grant tonight’s access. Try again near the entrance.');
  }
  return { serviceUrl: normalizedServiceUrl(data.service_url), token: data.token };
}

export async function fetchCommunityInfo(serviceUrlInput: string): Promise<CommunityInfo> {
  const serviceUrl = normalizedServiceUrl(serviceUrlInput);
  const response = await fetch(`${serviceUrl}/community/info`, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('The invite issuer could not be reached. Try again when you are online.');
  const data = await response.json() as Partial<CommunityInfo>;
  if (
    !/^[0-9a-f]{64}$/i.test(data.badge_issuer || '') ||
    !/^wss?:\/\//.test(data.relay_url || '') ||
    !/^30009:[0-9a-f]{64}:.+/i.test(data.required_badge || '')
  ) throw new Error('The invite issuer returned incomplete identity details.');
  return data as CommunityInfo;
}

export async function loadInvitePreview(serviceUrlInput: string, token: string): Promise<InvitePreview> {
  const serviceUrl = normalizedServiceUrl(serviceUrlInput);
  const claims = decodeInviteToken(token);
  const community = await fetchCommunityInfo(serviceUrl);
  if (claims.badge !== community.required_badge) {
    throw new Error('This invite does not match the membership offered by this venue.');
  }
  const addressIssuer = community.required_badge.split(':')[1];
  if (addressIssuer !== community.badge_issuer) {
    throw new Error('The venue membership issuer does not match its published identity.');
  }
  return { claims, community, serviceUrl };
}

async function storedRedemptions(): Promise<Record<string, InviteRedemption>> {
  try {
    return JSON.parse((await SecureStore.getItemAsync(REDEMPTIONS_KEY)) || '{}');
  } catch {
    return {};
  }
}

export async function listInviteRedemptions(): Promise<InviteRedemption[]> {
  return Object.values(await storedRedemptions()).sort((a, b) => b.redeemedAt - a.redeemedAt);
}

const pending = new Map<string, Promise<InviteRedemption>>();

export async function redeemInvite(preview: InvitePreview, token: string, pubkey: string): Promise<InviteRedemption> {
  if (!/^[0-9a-f]{64}$/i.test(pubkey)) throw new Error('Log in before accepting this invite.');
  const key = `${preview.claims.nonce}:${pubkey}`;
  const existing = (await storedRedemptions())[key];
  if (existing) return existing;
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const request = (async () => {
    const response = await fetch(`${preview.serviceUrl}/redeem`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, pubkey }),
    });
    const data = await response.json().catch(() => ({})) as { event_id?: string; error?: string; message?: string };
    if (!response.ok || !/^[0-9a-f]{64}$/i.test(data.event_id || '')) {
      throw new Error(data.error || data.message || 'The venue could not accept this invite.');
    }
    const redemption: InviteRedemption = {
      eventId: data.event_id!, nonce: preview.claims.nonce, pubkey, redeemedAt: Date.now(), badgeAddress: preview.claims.badge, serviceUrl: preview.serviceUrl,
    };
    const redemptions = await storedRedemptions();
    redemptions[key] = redemption;
    await SecureStore.setItemAsync(REDEMPTIONS_KEY, JSON.stringify(redemptions));
    if (__DEV__) console.info(`[crays-invite-redeemed]${JSON.stringify(redemption)}`);
    return redemption;
  })().finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

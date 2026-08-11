import * as Crypto from 'expo-crypto';
import type { Event, EventTemplate } from 'nostr-tools';

import { signActiveEvent } from '@/account/account';
import { presentationContextFor } from '@/access/entitlements';
import { isDefinitionAddress } from '@/access/nip97';
import type { RoomEntitlement } from '@/rooms/types';

export const PRESENTATION_KIND = 27236;
export const PRESENTATION_PREFIX = 'nuts:present:';
export const PRESENTATION_LIFETIME_SECONDS = 90;
export const PRESENTATION_REFRESH_MS = 60_000;
export const ENTITLEMENT_PRESENTATION_TYPE = 'nuts_entitlement_presentation';

function isHex(value: string) { return /^[0-9a-f]{64}$/i.test(value); }

/** NIP-97: the presented `a` tag may reference any definition family. */
function validBadgeAddress(value: string) {
  const [, author, ...d] = value.split(':');
  return isDefinitionAddress(value) && isHex(author) && Boolean(d.join(':'));
}

function validEventAddress(value: string) {
  const [kind, author, ...d] = value.split(':');
  return (kind === '31922' || kind === '31923') && isHex(author) && Boolean(d.join(':'));
}

function validRelay(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === 'ws:' || url.protocol === 'wss:') && Boolean(url.host);
  } catch { return false; }
}

export function entitlementPresentationTemplate({
  awardId,
  badgeAddress,
  community,
  nonce,
  orderId,
  eventAddress,
  createdAt = Math.floor(Date.now() / 1000),
}: {
  awardId: string;
  badgeAddress: string;
  community: string;
  nonce: string;
  orderId?: string;
  eventAddress?: string;
  createdAt?: number;
}): EventTemplate {
  if (!isHex(awardId)) throw new Error('Award event ID is invalid.');
  if (!validBadgeAddress(badgeAddress)) throw new Error('Entitlement address is invalid.');
  if (!validRelay(community)) throw new Error('Venue relay is invalid.');
  if (!nonce) throw new Error('Presentation nonce is missing.');
  if (Boolean(orderId) === Boolean(eventAddress)) throw new Error('Exactly one presentation context is required.');
  if (eventAddress && !validEventAddress(eventAddress)) throw new Error('Event address is invalid.');
  return {
    kind: PRESENTATION_KIND,
    created_at: createdAt,
    content: '',
    tags: [
      ['type', ENTITLEMENT_PRESENTATION_TYPE],
      ['expiration', String(createdAt + PRESENTATION_LIFETIME_SECONDS)],
      ['nonce', nonce],
      ['e', awardId],
      ['a', badgeAddress],
      ['r', community],
      ...(orderId ? [['order', orderId]] : [['event', eventAddress!]]),
    ],
  };
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    const block = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    output += alphabet[(block >>> 18) & 63] + alphabet[(block >>> 12) & 63];
    output += b === undefined ? '=' : alphabet[(block >>> 6) & 63];
    output += c === undefined ? '=' : alphabet[block & 63];
  }
  return output.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function encodePresentation(event: Event) {
  return `${PRESENTATION_PREFIX}${base64Url(JSON.stringify(event))}`;
}

async function secureNonce() {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createEntitlementPresentation(item: RoomEntitlement) {
  const [nonce, contextNonce] = await Promise.all([secureNonce(), secureNonce()]);
  const context = presentationContextFor(item, contextNonce);
  const event = await signActiveEvent(entitlementPresentationTemplate({
    awardId: item.awardId,
    badgeAddress: item.badgeAddress,
    community: item.relayUrl,
    nonce,
    ...context,
  }));
  const payload = encodePresentation(event);
  if (__DEV__) console.info(`[crays-presentation]${JSON.stringify({ event, payload })}`);
  return { event, payload };
}

import * as Crypto from 'expo-crypto';
import type { Event, EventTemplate } from 'nostr-tools';

import { ensureLocalIdentity, signActiveEvent } from '@/account/account';

/**
 * Shared Stripe payment-service origin. The production service uses Stripe's
 * configured test/live mode for the connected community account; QA can point
 * the same request contract at a deterministic local adapter.
 */
export const PAYMENT_SERVICE_ORIGIN = (
  process.env.EXPO_PUBLIC_PAYMENT_SERVICE_URL || 'https://payments.nuts.cash'
).replace(/\/+$/, '');

export const CHECKOUT_API_URL = `${PAYMENT_SERVICE_ORIGIN}/stripe/checkout`;
export const CHECKOUT_RETURN_TO = '/explore';
const SIGN_TIMEOUT_MS = 20_000;

export type CheckoutRequest = {
  community: string;
  eventAddress: string;
  returnTo?: string;
};

export function checkoutRequestBody({ community, eventAddress, returnTo = CHECKOUT_RETURN_TO }: CheckoutRequest): string {
  return JSON.stringify({ community, eventAddress, returnTo });
}

function base64Encode(value: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let index = 0;
  while (index < value.length) {
    const chr1 = value.charCodeAt(index++);
    const chr2 = value.charCodeAt(index++);
    const chr3 = value.charCodeAt(index++);
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = Number.isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = Number.isNaN(chr3) ? 64 : chr3 & 63;
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

function base64UrlEncode(value: string): string {
  return base64Encode(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function canonicalAuthEvent(event: Event) {
  if (!event.id || !event.pubkey || !event.sig) throw new Error('The checkout authorization signature is incomplete.');
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
    sig: event.sig,
  };
}

let signQueue = Promise.resolve();

function signCheckoutEvent(template: EventTemplate): Promise<Event> {
  const next = signQueue.then(() => new Promise<Event>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out while signing checkout authorization.')), SIGN_TIMEOUT_MS);
    try {
      signActiveEvent(template).then((event) => {
        clearTimeout(timeout);
        resolve(event);
      }).catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  }));
  signQueue = next.then(() => undefined, () => undefined);
  return next;
}

/** NIP-98 (kind 27235) authorization for POST /stripe/checkout. */
export async function makeCheckoutAuthorization(url: string, body: string): Promise<string> {
  const payloadHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    body,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  const event = await signCheckoutEvent({
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', url],
      ['method', 'POST'],
      ['payload', payloadHash],
    ],
    content: '',
  });
  return `Nostr ${base64UrlEncode(JSON.stringify(canonicalAuthEvent(event)))}`;
}

/**
 * Creates a hosted Stripe Checkout Session. Payment completion is asynchronous:
 * the payment service later publishes the product award through the room's
 * redemption service, and RoomData observes that award from the relay.
 */
export async function requestCheckoutUrl(request: CheckoutRequest): Promise<string> {
  await ensureLocalIdentity();
  const body = checkoutRequestBody(request);
  const authorization = await makeCheckoutAuthorization(CHECKOUT_API_URL, body);
  const response = await fetch(CHECKOUT_API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization },
    body,
  });
  const result = (await response.json().catch(() => ({}))) as { url?: unknown; message?: unknown; error?: unknown };
  if (!response.ok) {
    const message = typeof result.message === 'string' ? result.message : typeof result.error === 'string' ? result.error : 'Stripe checkout is unavailable.';
    throw new Error(message);
  }
  if (typeof result.url !== 'string' || !result.url) throw new Error('Stripe did not return a checkout URL.');
  return result.url;
}

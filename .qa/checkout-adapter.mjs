#!/usr/bin/env node

// Deterministic browser handoff for the RN checkout scenario. The app uses
// the production request contract, while this adapter skips Stripe's hosted
// card form and performs the same signed payment redemption that the Stripe
// webhook performs after a paid test session.

import http from 'node:http';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { getPublicKey, verifyEvent } from 'nostr-tools';
import { makePool, nip98Header, nowSeconds } from './relay-lib.mjs';

const host = process.env.CRAYS_CHECKOUT_ADAPTER_HOST || '0.0.0.0';
const port = Number(process.env.CRAYS_CHECKOUT_ADAPTER_PORT || 8790);
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('CRAYS_CHECKOUT_ADAPTER_PORT must be a valid TCP port');
const publicOrigin = (process.env.CRAYS_CHECKOUT_ADAPTER_PUBLIC_URL || `http://10.0.2.2:${port}`).replace(/\/+$/, '');
const checkoutUrl = `${publicOrigin}/stripe/checkout`;
const statePath = process.env.CRAYS_CHECKOUT_STATE || process.env.CRAYS_QA_STATE || '/tmp/qa-crays-14-review-pay.json';
const state = JSON.parse(readFileSync(statePath, 'utf8'));
const paymentSecret = readPaymentSecret();
const paymentPubkey = getPublicKey(Uint8Array.from(Buffer.from(paymentSecret, 'hex')));

if (!state.relay_url || !state.base_url || !state.product_addresses?.length) {
  throw new Error(`checkout adapter state is incomplete: ${statePath}`);
}

function readPaymentSecret() {
  const direct = process.env.QA_PAYMENT_SERVICE_SECRET || process.env.NUTS_PAYMENT_SERVICE_SECRET_KEY;
  if (/^[0-9a-f]{64}$/i.test(direct || '')) return direct;
  const envPath = process.env.NUTS_CASH_ENV || '/root/code/nuts-cash/.env';
  if (existsSync(envPath)) {
    const line = readFileSync(envPath, 'utf8').split('\n').find((entry) => entry.startsWith('NUTS_PAYMENT_SERVICE_SECRET_KEY='));
    const value = line?.slice('NUTS_PAYMENT_SERVICE_SECRET_KEY='.length).trim();
    if (/^[0-9a-f]{64}$/i.test(value || '')) return value;
  }
  throw new Error('checkout adapter needs QA_PAYMENT_SERVICE_SECRET or the Nuts payment-service key in /root/code/nuts-cash/.env');
}

class CheckoutError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function tagValue(tags, name) {
  return tags.find((tag) => tag[0] === name)?.[1] || '';
}

function decodeAuthorization(header, body) {
  if (typeof header !== 'string' || !header.startsWith('Nostr ')) throw new CheckoutError(401, 'NIP-98 authorization is required');
  let event;
  try {
    event = JSON.parse(Buffer.from(header.slice(6), 'base64url').toString('utf8'));
  } catch {
    throw new CheckoutError(401, 'NIP-98 authorization is invalid');
  }
  if (!verifyEvent(event) || event.kind !== 27235) throw new CheckoutError(401, 'NIP-98 authorization is invalid');
  if (Math.abs(nowSeconds() - event.created_at) > 300) throw new CheckoutError(401, 'NIP-98 authorization is stale');
  if (tagValue(event.tags, 'u') !== checkoutUrl || tagValue(event.tags, 'method') !== 'POST') {
    throw new CheckoutError(401, 'NIP-98 authorization does not match checkout');
  }
  const payload = createHash('sha256').update(body).digest('hex');
  if (tagValue(event.tags, 'payload') !== payload) throw new CheckoutError(401, 'NIP-98 payload hash does not match checkout');
  return event;
}

function productAddressParts(address) {
  const match = /^(30402):([0-9a-f]{64}):(.+)$/i.exec(String(address));
  if (!match) throw new CheckoutError(400, 'Checkout currently supports menu products only');
  return { kind: Number(match[1]), author: match[2], identifier: match[3] };
}

async function currentProduct(address) {
  const { kind, author, identifier } = productAddressParts(address);
  const pool = makePool();
  try {
    return await pool.get([state.relay_url], { kinds: [kind], authors: [author], '#d': [identifier], limit: 1 }, { maxWait: 5000 });
  } finally {
    pool.close([state.relay_url]);
  }
}

function validateProduct(definition, address) {
  if (!definition || !verifyEvent(definition)) throw new CheckoutError(404, 'Menu item was not found on the room relay');
  const expected = `30402:${definition.pubkey}:${tagValue(definition.tags, 'd')}`;
  if (expected !== address || definition.pubkey !== state.operator_pubkey) throw new CheckoutError(422, 'Menu item address is not authoritative for this room');
  if (!definition.tags.some((tag) => tag[0] === 't' && tag[1] === 'product')) throw new CheckoutError(422, 'Menu item is not a sellable product');
  if (tagValue(definition.tags, 'availability') !== 'available' || tagValue(definition.tags, 'status') !== 'active') throw new CheckoutError(422, 'Menu item is not currently available');
  if (!tagValue(definition.tags, 'price') || !/^[A-Z]{3}$/i.test(definition.tags.find((tag) => tag[0] === 'price')?.[2] || '')) throw new CheckoutError(422, 'Menu item has no payable price');
}

async function redeemPayment({ definition, address, buyer }) {
  const url = `${state.base_url.replace(/\/+$/, '')}/redeem`;
  const redemptionId = `qa-checkout-${buyer.slice(0, 16)}-${definition.id}`;
  const body = JSON.stringify({
    type: 'payment',
    redemption_id: redemptionId,
    payment_id: `qa-payment-${definition.id}-${buyer.slice(0, 16)}`,
    order_id: redemptionId,
    definition_event_id: definition.id,
    membership_event_id: definition.id,
    badge_address: address,
    recipient_pubkey: buyer,
    purchase_type: 'product',
    quantity: 1,
    paid_at: nowSeconds(),
  });
  const response = await fetch(url, {
    method: 'POST',
    headers: { authorization: nip98Header(url, 'POST', body, paymentSecret), 'content-type': 'application/json' },
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.event_id !== 'string') throw new CheckoutError(response.status || 502, result.error || 'Payment redemption failed');
  return { ...result, redemptionId };
}

async function handleCheckout(body, authorization) {
  const auth = decodeAuthorization(authorization, body);
  if (state.qa_pubkey && auth.pubkey !== state.qa_pubkey) throw new CheckoutError(403, 'Checkout adapter is scoped to the QA identity');
  let request;
  try { request = JSON.parse(body); } catch { throw new CheckoutError(400, 'Invalid checkout JSON'); }
  if (request.community !== state.relay_url) throw new CheckoutError(422, 'Checkout must use the signed room relay');
  if (typeof request.eventAddress !== 'string') throw new CheckoutError(400, 'Menu item address is required');
  const definition = await currentProduct(request.eventAddress);
  validateProduct(definition, request.eventAddress);
  const redemption = await redeemPayment({ definition, address: request.eventAddress, buyer: auth.pubkey });
  console.log(`[checkout] community=${state.relay_url} item=${request.eventAddress} type=product buyer=${auth.pubkey} payment_key=${paymentPubkey} award=${redemption.event_id} redemption=${redemption.redemptionId}`);
  return { url: `${publicOrigin}/checkout/success?award=${encodeURIComponent(redemption.event_id)}` };
}

const successPage = `<!doctype html><html><head><meta charset="utf-8"><title>Payment successful</title></head><body><main><h1>Payment successful</h1><p>Your purchase was fulfilled. Return to Crays.</p></main></body></html>`;

function sendJson(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(value));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'GET' && url.pathname === '/healthz') {
    sendJson(response, 200, { ok: true, relay_url: state.relay_url });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/checkout/success') {
    console.log(`[checkout] success page viewed award=${url.searchParams.get('award') || ''}`);
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(successPage);
    return;
  }
  if (request.method !== 'POST' || url.pathname !== '/stripe/checkout') {
    sendJson(response, 404, { error: 'not found' });
    return;
  }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8');
  try {
    sendJson(response, 200, await handleCheckout(body, request.headers.authorization));
  } catch (error) {
    const status = error instanceof CheckoutError ? error.status : 500;
    console.error(`[checkout] failed: ${status} ${error.message}`);
    sendJson(response, status, { error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`checkout adapter listening on ${host}:${port}`);
  console.log(`  POST ${checkoutUrl}`);
  console.log(`  state ${statePath}`);
});

function stop() {
  server.close(() => process.exit(0));
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);

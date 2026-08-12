#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { verifyEvent } from 'nostr-tools';
import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.relay_url || !state.qa_pubkey || !state.badge_issuer_pubkey || !state.product_addresses?.length) {
  throw new Error('checkout verification state is incomplete');
}

const tagValue = (event, name) => event.tags.find((tag) => tag[0] === name)?.[1] || '';
const pool = makePool();
const { result: award } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [8], authors: [state.badge_issuer_pubkey], '#p': [state.qa_pubkey], limit: 100 },
  (events) => events.find((event) =>
    state.product_addresses.includes(tagValue(event, 'a')) &&
    tagValue(event, 'i').startsWith('payment-redemption:qa-checkout-') &&
    tagValue(event, 'payment').startsWith('qa-payment-'),
  ),
  'payment checkout publishes a product award for the QA identity',
);
pool.close([state.relay_url]);

assert(verifyEvent(award), 'checkout award has a valid badge-issuer signature');
assert(award.pubkey === state.badge_issuer_pubkey, 'checkout award is signed by the delegated badge issuer');
assert(state.product_addresses.includes(tagValue(award, 'a')), 'checkout award references a seeded product address');
assert(tagValue(award, 'p') === state.qa_pubkey, 'checkout award is addressed to the checkout identity');
assert(tagValue(award, 'e'), 'checkout award carries the purchased definition event id');
assert(tagValue(award, 'i').startsWith('payment-redemption:qa-checkout-'), 'checkout award carries the payment redemption reference');

// UI markers are only a complement: the relay query above is the protocol
// proof, but this confirms the running app observed the same award.
const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
assert(logcat.includes(`[crays-room-data]{"type":"award","id":"${award.id}"}`), 'app observed the signed checkout award');
console.log(`CRAYS CHECKOUT ORDER PASS: ${award.id}`);

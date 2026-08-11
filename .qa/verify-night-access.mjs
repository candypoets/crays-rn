#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools';

import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
const claims = JSON.parse(Buffer.from(state.invite_token.split('.')[0], 'base64url').toString('utf8'));
// NIP-97: the award is signed by the anchor's delegated badge issuer; the
// definition itself is authored by the community root.
const issuer = state.badge_issuer_pubkey || state.required_badge.split(':')[1];
const pool = makePool();
const { events: awards } = await queryUntil(
  pool,
  state.relay_url,
  {
    kinds: [8],
    authors: [issuer],
    '#a': [state.required_badge],
    '#p': [state.qa_pubkey],
    limit: 20,
  },
  (events) => events.length >= 1,
  'entry redeemed a night-access badge for the app identity',
);
pool.close([state.relay_url]);
const tag = (event, name) => event.tags.find((value) => value[0] === name)?.[1];
assert(awards.length === 1, 'entry redeemed exactly one night-access badge for the app identity');
assert(verifyEvent(awards[0]), 'night-access badge has a valid issuer signature');
assert(Number.isSafeInteger(claims.badge_exp) && claims.badge_exp > Math.floor(Date.now() / 1000), 'night-access badge has a future expiry');
assert(claims.badge_exp <= claims.exp, 'night-access badge cannot outlive the 24-hour invite');
assert(Number(tag(awards[0], 'expiration')) === claims.badge_exp, 'issuer-signed badge carries the exact 24-hour expiry');
console.log('CRAYS NIGHT ACCESS VERIFY PASS');

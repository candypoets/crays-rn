#!/usr/bin/env node
// Idempotency contract for repeat invite redemption, per
// docs/screens/08b-invite-accepted.md and redeemInvite in
// src/invites/invites.ts: the stored nonce/account redemption is reused, so
// the second attempt succeeds WITHOUT a second /redeem call and the relay
// must hold exactly one award for the invite nonce.
import { execFileSync } from 'node:child_process';
import { verifyEvent } from 'nostr-tools';
import { assert, makePool, queryUntil, readState, settleBeforeAbsence } from './relay-lib.mjs';

const state = readState();
if (!state?.invite_token || !state.qa_pubkey) throw new Error('invite QA state is incomplete');
const claims = JSON.parse(Buffer.from(state.invite_token.split('.')[0], 'base64url').toString('utf8'));
const nonceTag = `invite-redemption:${claims.nonce}`;
const filter = { kinds: [8], '#p': [state.qa_pubkey], limit: 100 };
const pool = makePool();
const { result: award } = await queryUntil(
  pool,
  state.relay_url,
  filter,
  (events) => events.find((event) => event.tags.some((tag) => tag[0] === 'i' && tag[1] === nonceTag)),
  'invite redemption issued an award with the exact token nonce',
);
assert(verifyEvent(award), 'invite award signature is cryptographically valid');
await settleBeforeAbsence('a duplicate invite award cannot still be in flight');
const events = await pool.querySync([state.relay_url], filter);
pool.close([state.relay_url]);
const awards = events.filter((event) => event.tags.some((tag) => tag[0] === 'i' && tag[1] === nonceTag));
assert(awards.length === 1, 'redeeming the same invite token twice stores exactly one relay award (idempotent)');
const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const markers = logcat.split('\n').filter((line) => line.includes('[crays-invite-redeemed]'));
assert(markers.length === 1, 'app redeemed through the invite service exactly once; the repeat reused the stored redemption');
console.log('CRAYS INVITE REDEMPTION IDEMPOTENCY PASS');

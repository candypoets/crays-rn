#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools';
import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.invite_token || !state.qa_pubkey) throw new Error('invite QA state is incomplete');
const claims = JSON.parse(Buffer.from(state.invite_token.split('.')[0], 'base64url').toString('utf8'));
const pool = makePool();
const { result: award } = await queryUntil(
  pool, state.relay_url,
  { kinds: [8], '#p': [state.qa_pubkey], limit: 100 },
  (events) => events.find((event) => event.tags.some((tag) => tag[0] === 'i' && tag[1] === `invite-redemption:${claims.nonce}`)),
  'invite redemption issued an award with the exact token nonce',
);
pool.close([state.relay_url]);
assert(Boolean(award), 'invite redemption issued an award with the exact token nonce');
assert(verifyEvent(award), 'invite award signature is cryptographically valid');
assert(award.pubkey === state.badge_issuer_pubkey, 'award is signed by the root-delegated badge issuer');
assert(award.tags.some((tag) => tag[0] === 'a' && tag[1] === claims.badge), 'award is bound to the invited membership');
assert(award.tags.some((tag) => tag[0] === 'p' && tag[1] === state.qa_pubkey), 'award belongs to the QA account selected in the app');
assert(award.tags.some((tag) => tag[0] === 't' && tag[1] === 'membership'), 'award is explicitly a membership');
console.log('CRAYS INVITE REDEMPTION VERIFY PASS');

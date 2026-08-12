#!/usr/bin/env node
import { assert, makePool, readState, settleBeforeAbsence } from './relay-lib.mjs';

const state = readState();
if (!state?.relay_url || !state.required_badge || !state.badge_issuer_pubkey || !state.qa_pubkey) {
  throw new Error('Test Room state is incomplete for the no-invite verification');
}
assert(!state.invite_token, 'nearby Test Room bootstrap did not mint an invite token');
await settleBeforeAbsence('a nearby-room entry cannot leave a delayed invite award');
const pool = makePool();
const awards = await pool.querySync([state.relay_url], {
  kinds: [8],
  authors: [state.badge_issuer_pubkey],
  '#a': [state.required_badge],
  '#p': [state.qa_pubkey],
  limit: 20,
});
pool.close([state.relay_url]);
assert(awards.length === 0, 'nearby Test Room entry did not redeem a membership invite');
console.log('CRAYS NO INVITE REDEMPTION VERIFY PASS');

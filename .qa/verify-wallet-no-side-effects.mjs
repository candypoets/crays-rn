#!/usr/bin/env node
import { assert, makePool, readState, settleBeforeAbsence } from './relay-lib.mjs';

const state = readState();
await settleBeforeAbsence('wallet and add-funds screens publish no NIP-60 state');
const pool = makePool();
const events = await pool.querySync(
  [state.relay_url],
  { authors: [state.qa_pubkey], kinds: [17375, 7375, 7376], limit: 50 },
);
pool.close([state.relay_url]);
assert(events.length === 0, 'unconfigured wallet UI publishes no wallet configuration, proof, or spending-history events');
console.log('CRAYS WALLET NO-SIDE-EFFECT VERIFY PASS');

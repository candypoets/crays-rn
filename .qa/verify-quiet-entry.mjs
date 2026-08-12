#!/usr/bin/env node
import { assert, makePool, readState, settleBeforeAbsence } from './relay-lib.mjs';

const state = readState();
await settleBeforeAbsence('quiet entry publishes no app-authored room presence');
const pool = makePool();
const events = await pool.querySync([state.relay_url], { kinds: [10312], authors: [state.qa_pubkey], limit: 20 });
pool.close([state.relay_url]);
assert(events.length === 0, 'quiet entry publishes no app-authored NIP-53 presence');
console.log('CRAYS QUIET ENTRY VERIFY PASS');

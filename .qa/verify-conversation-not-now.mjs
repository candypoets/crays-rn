#!/usr/bin/env node
import { assert, makePool, readState, settleBeforeAbsence } from './relay-lib.mjs';

const state = readState();
await settleBeforeAbsence('Not now publishes no reply or report');
const pool = makePool();
const replies = await pool.querySync([state.relay_url], { kinds: [4], authors: [state.qa_pubkey], '#p': [state.fixture_pubkeys[1]], limit: 20 });
const reports = await pool.querySync([state.relay_url], { kinds: [1984], authors: [state.qa_pubkey], '#p': [state.fixture_pubkeys[1]], limit: 20 });
pool.close([state.relay_url]);
assert(replies.length === 0, 'Not now publishes no acceptance, reply, or decline reason');
assert(reports.length === 0, 'Not now does not silently report the sender');
console.log('CRAYS NOT NOW VERIFY PASS');

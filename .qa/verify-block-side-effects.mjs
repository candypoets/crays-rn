#!/usr/bin/env node
import { assert, makePool, readState, settleBeforeAbsence } from './relay-lib.mjs';

const state = readState();
await settleBeforeAbsence('block mutations publish no message or report side effects');
const pool = makePool();
const events = await pool.querySync([state.relay_url], { kinds: [4, 1984], authors: [state.qa_pubkey], limit: 30 });
pool.close([state.relay_url]);
assert(events.length === 0, 'local venue/global block changes publish no message or report side effects');
console.log('CRAYS BLOCK SIDE-EFFECT VERIFY PASS');

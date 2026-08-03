#!/usr/bin/env node
import { assert, makePool, readState } from './relay-lib.mjs';

const state = readState();
const pool = makePool();
const events = await pool.querySync([state.relay_url], { kinds: [78], authors: [state.qa_pubkey], '#h': [state.room_id], limit: 20 });
pool.close([state.relay_url]);
assert(events.length === 0, 'quiet entry publishes no app-authored room presence');
console.log('CRAYS QUIET ENTRY VERIFY PASS');

#!/usr/bin/env node
import { assert, makePool, readState, settleBeforeAbsence } from './relay-lib.mjs';
const state = readState(); const pubkey = process.env.QA_PUBKEY;
await settleBeforeAbsence('switch leaves zero destination presence');
const pool = makePool(); const events = await pool.querySync([state.relay_url], { kinds: [78], authors: [pubkey], '#h': [state.room_id], limit: 20 }); pool.close([state.relay_url]);
assert(!events.some((event) => event.tags.some((tag) => tag[0] === 'type' && tag[1] === 'presence')), 'switch stops at destination privacy screen with zero destination presence'); console.log('CRAYS SWITCH DESTINATION PRIVACY PASS');

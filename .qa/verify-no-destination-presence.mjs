#!/usr/bin/env node
import { assert, makePool, readState, settleBeforeAbsence } from './relay-lib.mjs';
const state = readState(); const pubkey = process.env.QA_PUBKEY;
await settleBeforeAbsence('switch leaves zero destination presence');
const pool = makePool(); const events = await pool.querySync([state.relay_url], { kinds: [10312], authors: [pubkey], '#a': [state.room_address], limit: 20 }); pool.close([state.relay_url]);
assert(events.length === 0, 'switch stops at destination privacy screen with zero NIP-53 presence'); console.log('CRAYS SWITCH DESTINATION PRIVACY PASS');

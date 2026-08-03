#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools'; import { assert, makePool, readState } from './relay-lib.mjs';
const state = readState(); const pool = makePool(); const events = await pool.querySync([state.relay_url], { kinds: [78], authors: [state.qa_pubkey], '#h': [state.room_id], limit: 20 }); pool.close([state.relay_url]);
const left = events.find((event) => event.tags.some((tag) => tag[0] === 'status' && tag[1] === 'left') && event.tags.some((tag) => tag[0] === 'd' && tag[1].endsWith(`/${state.qa_pubkey}`)));
assert(Boolean(left), 'visible account published the explicit left replacement event'); assert(verifyEvent(left), 'left event has a valid app signer signature'); console.log('CRAYS LEAVE VERIFY PASS');

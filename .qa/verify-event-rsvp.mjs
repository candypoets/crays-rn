#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools'; import { assert, makePool, readState } from './relay-lib.mjs';
const state = readState(); const pool = makePool(); const events = await pool.querySync([state.relay_url], { kinds: [31925], authors: [state.qa_pubkey], '#a': [state.event_address], limit: 20 }); pool.close([state.relay_url]);
const rsvp = events.find((event) => event.tags.some((tag) => tag[0] === 'status' && tag[1] === 'accepted'));
assert(Boolean(rsvp), 'app published an accepted RSVP for the exact calendar address'); assert(verifyEvent(rsvp), 'RSVP has a valid app signer signature'); console.log('CRAYS EVENT RSVP VERIFY PASS');

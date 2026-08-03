#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools'; import { assert, makePool, readState } from './relay-lib.mjs';
const state = readState(); const target = state.fixture_pubkeys[1]; const pool = makePool(); const events = await pool.querySync([state.relay_url], { kinds: [1984], authors: [state.qa_pubkey], '#p': [target], limit: 20 }); pool.close([state.relay_url]);
const report = events.find((event) => event.tags.some((tag) => tag[0] === 'h' && tag[1] === state.room_id)); assert(Boolean(report), 'app published a venue-scoped report for the selected person'); assert(verifyEvent(report), 'venue report has a valid app signer signature'); console.log('CRAYS VENUE REPORT VERIFY PASS');

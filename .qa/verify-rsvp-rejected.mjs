#!/usr/bin/env node
// docs/screens/20b-tickets.md: a rejected RSVP write must not appear in the
// durable ticket archive. The archive only records an RSVP after a relay OK
// (saveConfirmedRsvp), so the independent proof is: the badge-gated relay
// stored no kind-31925 from the app identity, and the app never logged its
// relay-confirmed RSVP marker. The flow complements this by asserting the
// event-screen error state and the empty Tickets archive.
import { execFileSync } from 'node:child_process';
import { assert, makePool, readState, settleBeforeAbsence } from './relay-lib.mjs';

const state = readState();
if (!state?.relay_url || !state.qa_pubkey) throw new Error('missing scenario state');
await settleBeforeAbsence('a lagging rejected RSVP cannot fake absence');
const pool = makePool();
const rsvps = await pool.querySync([state.relay_url], { kinds: [31925], authors: [state.qa_pubkey], limit: 20 });
pool.close([state.relay_url]);
assert(rsvps.length === 0, 'badge-gated relay stored no RSVP from the unauthorized app identity');
const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
assert(!logcat.includes('[crays-event-rsvp]'), 'app never logged a relay-confirmed RSVP, so nothing entered the durable archive');
console.log('CRAYS RSVP REJECTION VERIFY PASS');

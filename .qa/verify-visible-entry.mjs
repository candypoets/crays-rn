#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools';
import { assert, makePool, nowSeconds, readState } from './relay-lib.mjs';

const state = readState();
const pool = makePool();
const events = await pool.querySync([state.relay_url], { kinds: [78], authors: [state.qa_pubkey], '#h': [state.room_id], limit: 20 });
pool.close([state.relay_url]);
assert(events.length === 1, 'visible entry publishes exactly one app-authored presence');
const event = events[0];
const tag = (name) => event.tags.find((candidate) => candidate[0] === name)?.[1];
assert(verifyEvent(event), 'visible presence has a valid app identity signature');
assert(tag('d') === `life.crays/presence/v1/${state.room_id}/${state.qa_pubkey}`, 'presence has the exact replaceable room/account address');
assert(tag('schema') === 'life.crays/presence/v1' && tag('type') === 'presence', 'presence uses the versioned pilot schema');
assert(tag('visibility') === 'visible', 'presence is explicitly visible');
assert(tag('intent') === 'business', 'presence carries the selected intent');
assert(tag('context') === 'Here for the founders meetup', 'presence carries the exact optional context');
const remaining = Number(tag('expiration')) - nowSeconds();
assert(remaining >= 3_540 && remaining <= 3_600, 'presence expiry matches the selected one-hour automatic leave window');
console.log('CRAYS VISIBLE ENTRY VERIFY PASS');

#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools';
import { assert, makePool, nowSeconds, readState } from './relay-lib.mjs';

const state = readState();
const pool = makePool();
const posts = await pool.querySync([state.relay_url], { kinds: [1], authors: [state.qa_pubkey], '#h': [state.room_id], limit: 30 });
const reports = await pool.querySync([state.relay_url], { kinds: [1984], authors: [state.qa_pubkey], '#p': [state.fixture_pubkeys[1]], limit: 30 });
pool.close([state.relay_url]);
const authored = posts.filter((event) => event.content === 'Meet by the east stairs.');
assert(authored.length === 1, 'feed compose publishes exactly one matching room post');
assert(verifyEvent(authored[0]), 'room post has a valid app identity signature');
assert(authored[0].tags.some((tag) => tag[0] === 'client' && tag[1] === 'life.crays'), 'room post identifies the Crays client');
const expiry = Number(authored[0].tags.find((tag) => tag[0] === 'expiration')?.[1]);
assert(expiry > nowSeconds() && expiry <= nowSeconds() + 7_200, 'room post expires no later than the selected room session');
const targetPostId = state.feed_ids[2];
const report = reports.find((event) => event.tags.some((tag) => tag[0] === 'e' && tag[1] === targetPostId && tag[2] === 'other'));
assert(Boolean(report), 'feed report references the exact selected relay post');
assert(verifyEvent(report), 'feed report has a valid app identity signature');
assert(report.tags.some((tag) => tag[0] === 'h' && tag[1] === state.room_id), 'feed report is scoped to the exact venue');
console.log('CRAYS FEED ACTIONS VERIFY PASS');

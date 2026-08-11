#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools';
import { assert, makePool, nowSeconds, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.relay_url) throw new Error('run .qa/relay-bootstrap.mjs first');
const pool = makePool();
const { events } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [0, 1, 8, 78, 30009, 30078, 30402, 31727, 31923, 37237], limit: 200 },
  (polled) => polled.length >= 15,
  'fixture family remains queryable',
);
pool.close([state.relay_url]);

assert(events.length >= 15, 'fixture family remains queryable');
assert(events.every(verifyEvent), 'every fixture has a valid Nostr signature');
const manifest = events.find((event) => event.id === state.manifest_id);
assert(manifest?.pubkey === state.operator_pubkey, 'room manifest is signed by the expected operator');
assert(manifest.tags.some((tag) => tag[0] === 'schema' && tag[1] === 'life.crays/room/v1'), 'manifest schema is explicit');
assert(Number(manifest.tags.find((tag) => tag[0] === 'expiration')?.[1]) > nowSeconds(), 'manifest is fresh');
assert(state.presence_ids.every((id) => events.some((event) => event.id === id)), 'all visible presence fixtures are stored');
assert(state.feed_ids.every((id) => events.some((event) => event.id === id)), 'all room feed fixtures are stored');
assert(state.definition_ids.every((id) => events.some((event) => event.id === id)), 'all commerce definitions are stored');
console.log('CRAYS RELAY VERIFY PASS');

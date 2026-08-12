#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools';
import { assert, makePool, nowSeconds, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.relay_url) throw new Error('run .qa/relay-bootstrap.mjs first');
const pool = makePool();
const { events } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [0, 1, 8, 10312, 30009, 30078, 30402, 31727, 31923, 37237], limit: 200 },
  (polled) => polled.length >= 15,
  'fixture family remains queryable',
);
pool.close([state.relay_url]);

assert(events.length >= 15, 'fixture family remains queryable');
assert(events.every(verifyEvent), 'every fixture has a valid Nostr signature');
const anchor = events.find((event) => event.kind === 31727 && event.pubkey === state.community_root && event.tags.some((tag) => tag[0] === 'd' && tag[1] === 'community'));
assert(anchor, 'root-signed NIP-97 community anchor is independently queryable');
assert(anchor.tags.some((tag) => tag[0] === 'p' && tag[1] === state.operator_pubkey), 'NIP-97 anchor authorizes the fixture operator');
assert(anchor.tags.some((tag) => tag[0] === 'badge_issuer' && tag[1] === state.badge_issuer_pubkey), 'NIP-97 anchor delegates the fixture badge issuer');
const manifest = events.find((event) => event.id === state.manifest_id);
assert(manifest?.pubkey === state.operator_pubkey, 'legacy room selector is signed by the expected operator');
assert(manifest.tags.some((tag) => tag[0] === 'schema' && tag[1] === 'life.crays/room/v1'), 'legacy selector schema remains explicit');
assert(Number(manifest.tags.find((tag) => tag[0] === 'expiration')?.[1]) > nowSeconds(), 'legacy selector is fresh');
assert(state.presence_ids.every((id) => events.some((event) => event.id === id && event.kind === 10312)), 'all NIP-53 visible-presence fixtures are stored');
const communityAddress = `31727:${state.community_root}:community`;
const presences = events.filter((event) => state.presence_ids.includes(event.id));
assert(
  presences.every((event) => event.tags.some((tag) => tag[0] === 'a' && tag[1] === communityAddress && tag[2] === state.relay_url && tag[3] === 'root')),
  'all NIP-53 fixtures link the exact root-signed community anchor',
);
assert(presences.every((event) => !event.tags.some((tag) => ['d', 'h', 'schema', 'type', 'visibility'].includes(tag[0]))), 'NIP-53 fixtures contain no deprecated custom namespace tags');
assert(state.feed_ids.every((id) => events.some((event) => event.id === id)), 'all room feed fixtures are stored');
assert(state.definition_ids.every((id) => events.some((event) => event.id === id)), 'all commerce definitions are stored');
console.log('CRAYS RELAY VERIFY PASS');

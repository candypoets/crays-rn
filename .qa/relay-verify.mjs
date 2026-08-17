#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools';
import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.relay_url) throw new Error('run .qa/relay-bootstrap.mjs first');
const pool = makePool();
const { events } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [0, 1, 8, 10312, 30009, 30312, 30402, 31727, 31923, 37237], limit: 200 },
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
const roomDefinition = events.find((event) => event.id === state.room_definition_id);
assert(roomDefinition?.kind === 30312 && roomDefinition.pubkey === state.operator_pubkey, 'NIP-53 room definition is signed by the anchor admin');
assert(roomDefinition.tags.some((tag) => tag[0] === 'd' && tag[1] === state.room_id), 'room definition carries the scenario room identity');
assert(roomDefinition.tags.some((tag) => tag[0] === 'room' && tag[1] === state.room_name), 'room definition carries the display name');
assert(roomDefinition.tags.some((tag) => tag[0] === 'status' && tag[1] === 'open'), 'room definition is open');
assert(roomDefinition.tags.some((tag) => tag[0] === 'service' && tag[1] === state.base_url), 'room definition carries its NIP-53 service URL');
assert(roomDefinition.tags.some((tag) => tag[0] === 'p' && tag[1] === state.operator_pubkey && tag[3] === 'Host'), 'room definition carries a Host provider');
assert(state.presence_ids.every((id) => events.some((event) => event.id === id && event.kind === 10312)), 'all NIP-53 visible-presence fixtures are stored');
const presences = events.filter((event) => state.presence_ids.includes(event.id));
assert(
  presences.every((event) => event.tags.some((tag) => tag[0] === 'a' && tag[1] === state.room_address && tag[2] === state.relay_url && tag[3] === 'root')),
  'all NIP-53 fixtures link the exact kind-30312 room definition',
);
assert(presences.every((event) => !event.tags.some((tag) => ['d', 'h', 'schema', 'type', 'visibility'].includes(tag[0]))), 'NIP-53 fixtures contain no deprecated custom namespace tags');
assert(state.feed_ids.every((id) => events.some((event) => event.id === id)), 'all room feed fixtures are stored');
assert(state.definition_ids.every((id) => events.some((event) => event.id === id)), 'all commerce definitions are stored');
console.log('CRAYS RELAY VERIFY PASS');

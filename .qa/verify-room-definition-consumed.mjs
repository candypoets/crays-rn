#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { verifyEvent } from 'nostr-tools';
import { ROOM_DISPLAY_NAME } from './flow-fixtures.mjs';
import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.room_id) throw new Error('missing scenario state');

const pool = makePool();
const { result: definition } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [30312], authors: [state.operator_pubkey], '#d': [state.room_id], limit: 20 },
  (events) => events.find((event) => event.id === state.room_definition_id),
  'NIP-53 room definition is stored on the scenario relay',
);
pool.close([state.relay_url]);
const tag = (name) => definition.tags.find((candidate) => candidate[0] === name)?.[1];
assert(verifyEvent(definition), 'stored room definition has a valid operator signature');
assert(tag('d') === state.room_id, 'stored room definition carries the scenario room id');
assert(tag('room') === (state.room_name || ROOM_DISPLAY_NAME), 'stored room definition names the seeded room');
assert(tag('status') === 'open', 'stored room definition is open');
assert(tag('service') === state.base_url, 'stored room definition exposes the scenario service');
assert(definition.tags.some((candidate) => candidate[0] === 'p' && candidate[1] === state.operator_pubkey && candidate[3] === 'Host'), 'stored room definition names the expected Host');
assert(state.room_address === `30312:${state.operator_pubkey}:${state.room_id}`, 'scenario state carries the exact room address');

// Complementary app-side evidence that the root-authorized definition crossed
// the FlatBuffer boundary. Relay queries above remain the protocol proof.
const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const marker = '[crays-room-definition]';
const line = logcat.split('\n').findLast((entry) => entry.includes(marker) && entry.includes(`"id":"${state.room_id}"`));
if (!line) throw new Error('app never logged the NIP-53 definition for the scenario room');
let payload = line.slice(line.indexOf(marker) + marker.length).trim();
if (payload.startsWith("'")) payload = payload.slice(1);
if (payload.endsWith("'")) payload = payload.slice(0, -1);
const consumed = JSON.parse(payload);
assert(consumed.id === state.room_id, 'app consumed the scenario room id');
assert(consumed.address === state.room_address, 'app consumed the exact NIP-53 room address');
assert(consumed.rootPubkey === state.community_root, 'app consumed the NIP-11 community root');
assert(consumed.operatorPubkey === state.operator_pubkey, 'app consumed the anchor-authorized definition author');
assert(consumed.relayUrl === state.relay_url, 'app pinned the scenario community relay');
console.log('CRAYS NIP-53 ROOM DEFINITION CONSUMPTION PASS');

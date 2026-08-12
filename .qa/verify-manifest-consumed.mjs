#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { verifyEvent } from 'nostr-tools';
import { ROOM_DISPLAY_NAME } from './flow-fixtures.mjs';
import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.room_id) throw new Error('missing scenario state');

// Legacy regression only: this proves what the current app consumed, not
// community authority. NIP-97 trust is verified from NIP-11 + kind 31727 by
// relay-bootstrap, relay-verify, and invite redemption verification.
const pool = makePool();
const { result: manifest } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [30078], authors: [state.operator_pubkey], limit: 20 },
  (events) => events.find((event) => event.id === state.manifest_id),
  'legacy room selector is stored on the scenario relay',
);
pool.close([state.relay_url]);
const tag = (name) => manifest.tags.find((candidate) => candidate[0] === name)?.[1];
assert(verifyEvent(manifest), 'stored legacy selector has a valid operator signature');
assert(tag('d') === `life.crays/room/v1/${state.room_id}`, 'stored legacy selector carries the scenario room address');
assert(tag('schema') === 'life.crays/room/v1', 'stored legacy selector declares its pilot schema');
assert(tag('name') === (state.room_name || ROOM_DISPLAY_NAME), 'stored legacy selector names the seeded room');
assert(tag('relay') === state.relay_url, 'stored legacy selector points at the scenario relay');
assert(tag('operator') === state.operator_pubkey, 'stored legacy selector names the expected operator');

// Complementary app-side check: the app logged that it consumed this exact
// compatibility selector. Scoped to the scenario room id: in __DEV__ the app
// may also consume the Test Room selector, whose marker must not win.
const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const marker = '[crays-room-manifest]';
const line = logcat.split('\n').findLast((entry) => entry.includes(marker) && entry.includes(`"id":"${state.room_id}"`));
if (!line) throw new Error('app never logged the legacy selector for the scenario room');
let payload = line.slice(line.indexOf(marker) + marker.length).trim();
if (payload.startsWith("'")) payload = payload.slice(1);
if (payload.endsWith("'")) payload = payload.slice(0, -1);
const consumed = JSON.parse(payload);
assert(consumed.id === state.room_id, 'app consumed the scenario room id');
assert(consumed.operatorPubkey === state.operator_pubkey, 'app consumed the expected legacy operator field');
assert(consumed.relayUrl === state.relay_url, 'app consumed the scenario relay URL from the legacy selector');
console.log('CRAYS LEGACY ROOM SELECTOR CONSUMPTION PASS');

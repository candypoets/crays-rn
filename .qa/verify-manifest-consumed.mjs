#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { verifyEvent } from 'nostr-tools';
import { ROOM_DISPLAY_NAME } from './flow-fixtures.mjs';
import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.room_id) throw new Error('missing scenario state');

// Independent relay truth: the signed manifest the app claims to have
// consumed must exist on the scenario relay with the expected content.
const pool = makePool();
const { result: manifest } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [30078], authors: [state.operator_pubkey], limit: 20 },
  (events) => events.find((event) => event.id === state.manifest_id),
  'signed room manifest is stored on the scenario relay',
);
pool.close([state.relay_url]);
const tag = (name) => manifest.tags.find((candidate) => candidate[0] === name)?.[1];
assert(verifyEvent(manifest), 'stored room manifest has a valid operator signature');
assert(tag('d') === `life.crays/room/v1/${state.room_id}`, 'stored manifest carries the exact scenario room address');
assert(tag('schema') === 'life.crays/room/v1', 'stored manifest declares the versioned room schema');
assert(tag('name') === (state.room_name || ROOM_DISPLAY_NAME), 'stored manifest names the seeded room');
assert(tag('relay') === state.relay_url, 'stored manifest points at the authoritative scenario relay');
assert(tag('operator') === state.operator_pubkey, 'stored manifest names the expected operator');

// Complementary app-side check: the app logged that it consumed and verified
// this exact manifest. Scoped to the scenario room id: in __DEV__ the app may
// also consume the development Test Room manifest, whose marker must not win.
const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const marker = '[crays-room-manifest]';
const line = logcat.split('\n').findLast((entry) => entry.includes(marker) && entry.includes(`"id":"${state.room_id}"`));
if (!line) throw new Error('app never logged a verified room manifest for the scenario room');
let payload = line.slice(line.indexOf(marker) + marker.length).trim();
if (payload.startsWith("'")) payload = payload.slice(1);
if (payload.endsWith("'")) payload = payload.slice(0, -1);
const consumed = JSON.parse(payload);
assert(consumed.id === state.room_id, 'app consumed the scenario room id');
assert(consumed.operatorPubkey === state.operator_pubkey, 'app consumed the expected verified operator');
assert(consumed.relayUrl === state.relay_url, 'app consumed the authoritative relay URL from the signed manifest');
console.log('CRAYS MANIFEST CONSUMPTION PASS');

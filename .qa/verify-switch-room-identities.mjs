#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { verifyEvent } from 'nostr-tools';

import { assert, makePool, queryUntil } from './relay-lib.mjs';

const pathA = process.env.CRAYS_QA_STATE_A || '/tmp/qa-crays-28-switch-a.json';
const pathB = process.env.CRAYS_QA_STATE_B || '/tmp/qa-crays-28-switch-b.json';
if (!existsSync(pathA) || !existsSync(pathB)) throw new Error('switch-room identity states are missing');

const stateA = JSON.parse(readFileSync(pathA, 'utf8'));
const stateB = JSON.parse(readFileSync(pathB, 'utf8'));
assert(stateA.room_id && stateB.room_id && stateA.room_id !== stateB.room_id, 'room A and B have distinct identities');
assert(stateA.relay_url === stateB.relay_url, 'room A and B use the coordinator-reserved real relay');
assert(stateA.manifest_id && stateB.manifest_id && stateA.manifest_id !== stateB.manifest_id, 'room A and B have distinct manifest events');

const pool = makePool();
const { result: manifests } = await queryUntil(
  pool,
  stateA.relay_url,
  { kinds: [30078], ids: [stateA.manifest_id, stateB.manifest_id], limit: 2 },
  (events) => {
    const byId = new Map(events.map((event) => [event.id, event]));
    return byId.has(stateA.manifest_id) && byId.has(stateB.manifest_id)
      ? [byId.get(stateA.manifest_id), byId.get(stateB.manifest_id)]
      : null;
  },
  'both switch-room manifests round-trip from the real relay',
);
pool.close([stateA.relay_url]);

for (const [label, state, manifest] of [['A', stateA, manifests[0]], ['B', stateB, manifests[1]]]) {
  assert(verifyEvent(manifest), `room ${label} manifest has a valid signature`);
  assert(manifest.pubkey === state.operator_pubkey, `room ${label} manifest has the expected operator`);
  const d = manifest.tags.find((tag) => tag[0] === 'd')?.[1];
  const relay = manifest.tags.find((tag) => tag[0] === 'relay')?.[1];
  assert(d === `life.crays/room/v1/${state.room_id}`, `room ${label} manifest address matches its room identity`);
  assert(relay === state.relay_url, `room ${label} manifest points at its reserved relay`);
}

console.log('CRAYS SWITCH ROOM IDENTITY VERIFY PASS');

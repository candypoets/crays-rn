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
assert(stateA.room_definition_id && stateB.room_definition_id && stateA.room_definition_id !== stateB.room_definition_id, 'room A and B have distinct NIP-53 room definitions');

const pool = makePool();
const { result: definitions } = await queryUntil(
  pool,
  stateA.relay_url,
  { kinds: [30312], ids: [stateA.room_definition_id, stateB.room_definition_id], limit: 2 },
  (events) => {
    const byId = new Map(events.map((event) => [event.id, event]));
    return byId.has(stateA.room_definition_id) && byId.has(stateB.room_definition_id)
      ? [byId.get(stateA.room_definition_id), byId.get(stateB.room_definition_id)]
      : null;
  },
  'both switch-room definitions round-trip from the real relay',
);
pool.close([stateA.relay_url]);

for (const [label, state, definition] of [['A', stateA, definitions[0]], ['B', stateB, definitions[1]]]) {
  assert(verifyEvent(definition), `room ${label} definition has a valid signature`);
  assert(definition.pubkey === state.operator_pubkey, `room ${label} definition has the expected anchor-admin author`);
  const d = definition.tags.find((tag) => tag[0] === 'd')?.[1];
  const service = definition.tags.find((tag) => tag[0] === 'service')?.[1];
  assert(d === state.room_id, `room ${label} definition address matches its room identity`);
  assert(state.room_address === `30312:${state.operator_pubkey}:${state.room_id}`, `room ${label} state carries the exact NIP-53 address`);
  assert(service === state.base_url, `room ${label} definition points at its service`);
}

console.log('CRAYS SWITCH ROOM IDENTITY VERIFY PASS');

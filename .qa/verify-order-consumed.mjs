#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { verifyEvent } from 'nostr-tools';
import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.order_award_id || !state?.order_status_id) throw new Error('missing order scenario state');

// Independent relay truth: the signed product award and venue order status
// the app claims to have projected must exist with the seeded content.
const pool = makePool();
const { events } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [8, 37237], limit: 50 },
  (polled) => polled.some((event) => event.id === state.order_award_id) && polled.some((event) => event.id === state.order_status_id),
  'order award and order status are stored on the scenario relay',
);
pool.close([state.relay_url]);
const award = events.find((event) => event.id === state.order_award_id);
const status = events.find((event) => event.id === state.order_status_id);
const tag = (event, name) => event.tags.find((candidate) => candidate[0] === name)?.[1];
assert(verifyEvent(award), 'stored order award has a valid issuer signature');
assert(tag(award, 'order') === state.order_ref, 'stored order award carries the exact order reference');
assert(tag(award, 'p') === state.fixture_pubkeys[0], 'stored order award belongs to the seeded member');
assert(verifyEvent(status), 'stored order status has a valid operator signature');
assert(tag(status, 'status') === 'ready', 'stored order status is ready');
assert(tag(status, 'order') === state.order_ref && tag(status, 'd') === `order:${state.order_ref}`, 'stored order status addresses the exact order');
assert(tag(status, 'e') === state.order_award_id, 'stored order status references the exact award');

// Complementary app-side check: the app projected these exact events.
const log = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
assert(log.includes(`\"type\":\"award\",\"id\":\"${state.order_award_id}`) || log.includes(`"type":"award","id":"${state.order_award_id}`), 'app projected the exact signed product award');
assert(log.includes(`\"type\":\"order-status\",\"id\":\"${state.order_status_id}`) || log.includes(`"type":"order-status","id":"${state.order_status_id}`), 'app projected the exact venue order status');
assert(log.includes('"status":"ready"') || log.includes('\"status\":\"ready\"'), 'app consumed the ready status value');
console.log('CRAYS ORDER CONSUMPTION PASS');

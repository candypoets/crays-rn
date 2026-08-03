#!/usr/bin/env node
import { execFileSync } from 'node:child_process'; import { assert, readState } from './relay-lib.mjs';
const state = readState(); const log = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
assert(log.includes(`\"type\":\"award\",\"id\":\"${state.order_award_id}`) || log.includes(`"type":"award","id":"${state.order_award_id}`), 'app projected the exact signed product award');
assert(log.includes(`\"type\":\"order-status\",\"id\":\"${state.order_status_id}`) || log.includes(`"type":"order-status","id":"${state.order_status_id}`), 'app projected the exact venue order status');
assert(log.includes('"status":"ready"') || log.includes('\"status\":\"ready\"'), 'app consumed the ready status value');
console.log('CRAYS ORDER CONSUMPTION PASS');

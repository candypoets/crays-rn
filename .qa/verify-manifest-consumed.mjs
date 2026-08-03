#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { assert, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.room_id) throw new Error('missing scenario state');
const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const marker = '[crays-room-manifest]';
const line = logcat.split('\n').findLast((entry) => entry.includes(marker));
if (!line) throw new Error('app never logged a verified room manifest');
let payload = line.slice(line.indexOf(marker) + marker.length).trim();
if (payload.startsWith("'")) payload = payload.slice(1);
if (payload.endsWith("'")) payload = payload.slice(0, -1);
const consumed = JSON.parse(payload);
assert(consumed.id === state.room_id, 'app consumed the scenario room id');
assert(consumed.operatorPubkey === state.operator_pubkey, 'app consumed the expected verified operator');
assert(consumed.relayUrl === state.relay_url, 'app consumed the authoritative relay URL from the signed manifest');
console.log('CRAYS MANIFEST CONSUMPTION PASS');

#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { assert, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.room_id) throw new Error('missing scenario state');
const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const payloads = logcat
  .split('\n')
  .filter((line) => line.includes('[crays-room-data]'))
  .map((line) => {
    let payload = line.slice(line.indexOf('[crays-room-data]') + '[crays-room-data]'.length).trim();
    if (payload.startsWith("'")) payload = payload.slice(1);
    if (payload.endsWith("'")) payload = payload.slice(0, -1);
    try { return JSON.parse(payload); } catch { return null; }
  })
  .filter(Boolean);
const types = new Set(payloads.map((value) => value.type));
assert(types.has('profile'), 'app projected relay-backed room profiles');
assert(types.has('presence'), 'app projected relay-backed visible presence');
assert(types.has('post'), 'app projected relay-backed room feed events');
assert(types.has('product'), 'app projected relay-backed menu definitions');
assert(types.has('membership'), 'app projected relay-backed membership definition');
assert(types.has('event'), 'app projected relay-backed calendar event');
console.log('CRAYS ROOM CONSUMPTION PASS');

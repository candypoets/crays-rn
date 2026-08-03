#!/usr/bin/env node
import { execFileSync } from 'node:child_process'; import { existsSync, readFileSync } from 'node:fs'; import { loadKeys, warnTeardownLeak } from './relay-lib.mjs';
const root = new URL('..', import.meta.url).pathname; const pathA = '/tmp/qa-crays-28-switch-a.json'; const pathB = '/tmp/qa-crays-28-switch-b.json';
const run = (command, args, env = {}) => execFileSync(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: 'inherit', maxBuffer: 64 * 1024 * 1024 });
const envA = { CRAYS_QA_STATE: pathA, CRAYS_QA_USER_INDEX: '3' }; const envB = { CRAYS_QA_STATE: pathB, CRAYS_QA_USER_INDEX: '3' }; run('adb', ['get-state']); run('adb', ['logcat', '-c']);
const teardownLeak = (label, path, error) => { let state; try { state = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined; } catch { state = undefined; } warnTeardownLeak(label, state, error); };
try {
  run(process.execPath, ['.qa/relay-bootstrap.mjs'], envA); run(process.execPath, ['.qa/relay-bootstrap.mjs'], envB);
  if (!existsSync(pathA) || !existsSync(pathB)) throw new Error('two-relay bootstrap state missing');
  const a = JSON.parse(readFileSync(pathA, 'utf8')); const b = JSON.parse(readFileSync(pathB, 'utf8')); const keys = loadKeys();
  // users[3], not users[0]: the bootstrap seeds fixture presence for users 0-2
  // on every relay, so a users[0] app identity would make the zero-destination-
  // presence assertion impossible (mirrors qa-11-join-quiet/visible).
  run(process.env.MAESTRO_CLI || 'maestro', ['test', ...(process.env.ANDROID_SERIAL ? ['--device', process.env.ANDROID_SERIAL] : []), '-e', `QA_NSEC=${keys.users[3].nsec}`, '-e', `RELAY_A_URL=${a.emulator_relay_url}`, '-e', `ROOM_A_ID=${a.room_id}`, '-e', `RELAY_B_URL=${b.emulator_relay_url}`, '-e', `ROOM_B_ID=${b.room_id}`, 'maestro/flows/28-switch-room.yaml']);
  run(process.execPath, ['.qa/relay-verify.mjs'], envA); run(process.execPath, ['.qa/verify-left-room.mjs'], envA);
  run(process.execPath, ['.qa/relay-verify.mjs'], envB); run(process.execPath, ['.qa/verify-no-destination-presence.mjs'], { ...envB, QA_PUBKEY: keys.users[3].pub });
  console.log('QA PASS: 28-switch-room');
} finally {
  for (const [label, env, path] of [['28-switch-room/b', envB, pathB], ['28-switch-room/a', envA, pathA]]) { try { run(process.execPath, ['.qa/relay-teardown.mjs'], env); } catch (error) { teardownLeak(label, path, error); } }
}

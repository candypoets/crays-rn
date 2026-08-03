#!/usr/bin/env node
// Relay-unavailable join: no relay is provisioned on purpose — the app is
// pointed at a port with no listener and must render its error state instead
// of hanging. Because nothing is provisioned, teardown is a no-op: the logcat
// buffer is cleared before the flow and the app is reset by launch.yaml's
// clearState on the next scenario.
import { execFileSync } from 'node:child_process';
import { loadKeys } from './relay-lib.mjs';

const root = new URL('..', import.meta.url).pathname;
const run = (command, args, env = {}) => execFileSync(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: 'inherit', maxBuffer: 64 * 1024 * 1024 });

run('adb', ['get-state']);
run('adb', ['logcat', '-c']);
run(process.env.MAESTRO_CLI || 'maestro', [
  'test',
  ...(process.env.ANDROID_SERIAL ? ['--device', process.env.ANDROID_SERIAL] : []),
  '-e', `QA_NSEC=${loadKeys().users[0].nsec}`,
  '-e', 'RELAY_URL=ws://10.0.2.2:59999',
  '-e', 'ROOM_ID=unavailable-room',
  'maestro/flows/11c-join-relay-unavailable.yaml',
]);
run(process.execPath, ['.qa/verify-join-unavailable.mjs'], { ROOM_ID: 'unavailable-room' });
console.log('QA PASS: 11c-join-relay-unavailable');

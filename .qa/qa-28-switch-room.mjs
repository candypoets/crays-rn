#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process'; import { existsSync, readFileSync } from 'node:fs'; import { loadKeys, warnTeardownLeak } from './relay-lib.mjs';
import { selectProxyPort, stopProxy, waitForProxy } from './relay-screen-scenario.mjs';
const root = new URL('..', import.meta.url).pathname; const pathA = '/tmp/qa-crays-28-switch-a.json'; const pathB = '/tmp/qa-crays-28-switch-b.json';
const run = (command, args, env = {}) => execFileSync(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: 'inherit', maxBuffer: 64 * 1024 * 1024 });
const envA = {
  CRAYS_QA_STATE: pathA,
  CRAYS_QA_USER_INDEX: '3',
  CRAYS_TEST_ROOM_ID: 'crays-qa-switch-a',
  CRAYS_TEST_ROOM_NAME: 'The Skyline Room',
};
const envB = {
  CRAYS_QA_STATE: pathB,
  CRAYS_QA_USER_INDEX: '3',
  CRAYS_TEST_ROOM_ID: 'crays-qa-switch-b',
  CRAYS_TEST_ROOM_NAME: 'The Moonlight Room',
  // The deployed coordinator owner is limited to the reserved relay. Keep A
  // on that real relay while seeding B as a distinct signed room identity.
  CRAYS_QA_PRESERVE_FIXTURES: '1',
};
run('adb', ['get-state']); run('adb', ['logcat', '-c']);
const teardownLeak = (label, path, error) => { let state; try { state = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined; } catch { state = undefined; } warnTeardownLeak(label, state, error); };
let proxy;
try {
  run(process.execPath, ['.qa/relay-bootstrap.mjs'], envA); run(process.execPath, ['.qa/relay-bootstrap.mjs'], envB);
  if (!existsSync(pathA) || !existsSync(pathB)) throw new Error('two-room bootstrap state missing');
  const a = JSON.parse(readFileSync(pathA, 'utf8')); const b = JSON.parse(readFileSync(pathB, 'utf8')); const keys = loadKeys();
  if (!a.room_id || !b.room_id || a.room_id === b.room_id) throw new Error('switch fixtures must use distinct room identities');
  if (!a.manifest_id || !b.manifest_id || a.manifest_id === b.manifest_id) throw new Error('switch fixtures must publish distinct signed manifests');
  if (a.id !== b.id || a.relay_url !== b.relay_url) throw new Error('switch fixtures must share the reserved relay until the coordinator permits a second deployed relay');
  console.log(`ok - seeded distinct room identities ${a.room_id} and ${b.room_id} on real relay ${a.relay_url}`);
  run(process.execPath, ['.qa/verify-switch-room-identities.mjs'], { ...envA, CRAYS_QA_STATE_A: pathA, CRAYS_QA_STATE_B: pathB });
  const proxyPort = selectProxyPort(Number(process.env.CRAYS_TEST_ROOM_PROXY_PORT || 8787));
  const proxyEnv = {
    ...envB,
    CRAYS_TEST_ROOM_STATE: pathB,
    CRAYS_TEST_ROOM_PID: '/tmp/qa-crays-switch-room-proxy.pid',
    CRAYS_TEST_ROOM_PROXY_PORT: String(proxyPort),
    CRAYS_TEST_ROOM_USE_EXISTING_STATE: '1',
  };
  proxy = spawn(process.execPath, ['.qa/test-room.mjs'], { cwd: root, env: { ...process.env, ...proxyEnv }, stdio: 'inherit' });
  waitForProxy(proxy, proxyPort, b.room_id, pathB);
  const emulatorRelay = `ws://10.0.2.2:${proxyPort}`;
  // users[3], not users[0]: the bootstrap seeds fixture presence for users 0-2
  // on every relay, so a users[0] app identity would make the zero-destination-
  // presence assertion impossible (mirrors qa-11-join-quiet/visible).
  run(process.env.MAESTRO_CLI || 'maestro', ['test', ...(process.env.ANDROID_SERIAL ? ['--device', process.env.ANDROID_SERIAL] : []), '-e', `QA_NSEC=${keys.users[3].nsec}`, '-e', `RELAY_A_URL=${emulatorRelay}`, '-e', `ROOM_A_ID=${a.room_id}`, '-e', `RELAY_B_URL=${emulatorRelay}`, '-e', `ROOM_B_ID=${b.room_id}`, 'maestro/flows/28-switch-room.yaml']);
  // B replaces shared addressable catalog/profile definitions on this one
  // relay, so A's old definition event IDs are not expected to survive. The
  // switch contract instead requires both room manifests, A's confirmed left
  // replacement, B's complete latest fixture family, then absence in B.
  run(process.execPath, ['.qa/verify-switch-room-identities.mjs'], { ...envA, CRAYS_QA_STATE_A: pathA, CRAYS_QA_STATE_B: pathB });
  run(process.execPath, ['.qa/verify-left-room.mjs'], envA);
  run(process.execPath, ['.qa/relay-verify.mjs'], envB);
  run(process.execPath, ['.qa/verify-no-destination-presence.mjs'], { ...envB, QA_PUBKEY: keys.users[3].pub });
  console.log('QA PASS: 28-switch-room (distinct signed room identities on reserved relay)');
} finally {
  if (proxy) stopProxy(proxy);
  for (const [label, env, path] of [['28-switch-room/b', envB, pathB], ['28-switch-room/a', envA, pathA]]) { try { run(process.execPath, ['.qa/relay-teardown.mjs'], env); } catch (error) { teardownLeak(label, path, error); } }
}

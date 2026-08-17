import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CONVERSATION_REPLY_TEXT,
  FEED_POST_TEXT,
  FEED_REPLY_TEXT,
  JOIN_VISIBLE_CONTEXT,
  JOIN_VISIBLE_INTENT,
  MESSAGE_REQUEST_TEXT,
  ROOM_ABOUT,
  TEST_ROOM_QA_PROFILE_NAME,
} from './flow-fixtures.mjs';
import { loadKeys, warnTeardownLeak } from './relay-lib.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);

// This host runs multiple emulators (other crays worktrees). Pin adb via
// ANDROID_SERIAL (honored by every bare `adb` call in the harness) and pass
// --device to maestro, which does not read ANDROID_SERIAL.
export const deviceArgs = () => (process.env.ANDROID_SERIAL ? ['--device', process.env.ANDROID_SERIAL] : []);

function run(command, args, env) {
  try {
    return execFileSync(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: 'inherit', maxBuffer: 64 * 1024 * 1024 });
  } catch (cause) {
    // Maestro arguments contain fixture credentials and invite tokens. Its
    // own output is inherited above; do not repeat the full command in a
    // thrown Node error.
    throw new Error(`${command} exited with status ${cause.status ?? 'unknown'}`);
  }
}

function processIsRunning(pid) {
  try {
    process.kill(pid, 0);
    const state = readFileSync(`/proc/${pid}/stat`, 'utf8').split(' ')[2];
    return state !== 'Z';
  } catch {
    return false;
  }
}

function portIsListening(port) {
  return execFileSync('ss', ['-H', '-ltn', `sport = :${port}`], { encoding: 'utf8' }).trim().length > 0;
}

export function selectProxyPort(preferred) {
  for (let port = preferred; port < preferred + 20; port += 1) {
    if (!portIsListening(port)) {
      if (port !== preferred) console.log(`warn - proxy port ${preferred} is owned by another worktree; using ${port}`);
      return port;
    }
  }
  throw new Error(`no free Test Room proxy port in ${preferred}-${preferred + 19}`);
}

export function waitForProxy(child, port, expectedRoomId, statePath) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (!processIsRunning(child.pid)) throw new Error(`Test Room proxy exited before readiness (pid ${child.pid})`);
    try {
      const response = execFileSync('curl', ['-sf', `http://127.0.0.1:${port}/healthz`], { encoding: 'utf8', timeout: 2000 });
      const health = JSON.parse(response);
      if (health.room_id === expectedRoomId && existsSync(statePath)) return;
    } catch {
      // The child may still be seeding fixtures or binding the proxy.
    }
    execFileSync('sleep', ['0.5']);
  }
  throw new Error('Test Room proxy did not become ready within 120 seconds');
}

export function stopProxy(child) {
  stopChild(child, 'Test Room proxy');
}

function stopChild(child, label) {
  if (!child) return;
  if (!processIsRunning(child.pid)) return;
  process.kill(child.pid, 'SIGTERM');
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline && processIsRunning(child.pid)) execFileSync('sleep', ['0.25']);
  if (processIsRunning(child.pid)) {
    console.warn(`${label} did not stop after SIGTERM; sending SIGKILL`);
    process.kill(child.pid, 'SIGKILL');
  }
}

function waitForHttp(child, port, path, label) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (!processIsRunning(child.pid)) throw new Error(`${label} exited before readiness (pid ${child.pid})`);
    try {
      execFileSync('curl', ['-sf', `http://127.0.0.1:${port}${path}`], { encoding: 'utf8', timeout: 2000 });
      return;
    } catch {
      // The child may still be binding its HTTP listener.
    }
    execFileSync('sleep', ['0.5']);
  }
  throw new Error(`${label} did not become ready within 30 seconds`);
}

// Flow-typed strings live in .qa/flow-fixtures.mjs so verifiers and flows
// cannot drift apart. Flows that use these QA_* vars can only run standalone
// with explicit `maestro test -e KEY=value` overrides.
const fixtureEnv = {
  QA_FEED_POST_TEXT: FEED_POST_TEXT,
  QA_FEED_REPLY_TEXT: FEED_REPLY_TEXT,
  QA_JOIN_INTENT: JOIN_VISIBLE_INTENT,
  QA_JOIN_CONTEXT: JOIN_VISIBLE_CONTEXT,
  QA_MESSAGE_REQUEST_TEXT: MESSAGE_REQUEST_TEXT,
  QA_CONVERSATION_REPLY_TEXT: CONVERSATION_REPLY_TEXT,
  QA_PROFILE_NAME: TEST_ROOM_QA_PROFILE_NAME,
  QA_ROOM_ABOUT: ROOM_ABOUT,
};

export function runRelayScreenScenario({ flow, scenario, verifiers = [], qaUserIndex = 0, bootstrapEnv = {}, verifyRoomDefinition = true, checkoutAdapter = false, blossomAdapter = false }) {
  const statePath = `/tmp/qa-crays-${scenario}.json`;
  const preferredProxyPort = Number(process.env.CRAYS_TEST_ROOM_PROXY_PORT || 8787);
  const proxyPort = selectProxyPort(preferredProxyPort);
  const roomId = 'crays-qa-skyline';
  const env = {
    CRAYS_QA_STATE: statePath,
    CRAYS_TEST_ROOM_STATE: statePath,
    CRAYS_TEST_ROOM_PID: '/tmp/qa-crays-relay-proxy.pid',
    CRAYS_TEST_ROOM_PROXY_PORT: String(proxyPort),
    CRAYS_TEST_ROOM_PROXY: '1',
    CRAYS_TEST_ROOM_ID: roomId,
    CRAYS_TEST_ROOM_NAME: 'The Skyline Room',
    CRAYS_QA_MINT_INVITE: '1',
    // Ordinary screen scenarios exercise already-authorized room members.
    // The Test Room card scenario deliberately leaves this at 0 so its public
    // invite redemption is the only grant for the joining identity.
    CRAYS_QA_PREAUTHORIZE: '1',
    CRAYS_QA_USER_INDEX: String(qaUserIndex),
    CRAYS_BLOSSOM_PORT: '8791',
    CRAYS_BLOSSOM_STATE: `/tmp/qa-crays-${scenario}-blossom.json`,
    ...bootstrapEnv,
  };
  run('adb', ['get-state'], env);
  run('adb', ['logcat', '-c'], env);
  let scenarioFailed = false;
  let state;
  const testRoom = spawn(process.execPath, ['.qa/test-room.mjs'], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  let checkoutAdapterProcess;
  let blossomAdapterProcess;
  try {
    waitForProxy(testRoom, proxyPort, roomId, statePath);
    if (!existsSync(statePath)) throw new Error(`bootstrap did not write ${statePath}`);
    state = JSON.parse(readFileSync(statePath, 'utf8'));
    if (checkoutAdapter) {
      const checkoutPort = Number(process.env.CRAYS_CHECKOUT_ADAPTER_PORT || 8790);
      if (portIsListening(checkoutPort)) throw new Error(`checkout adapter port ${checkoutPort} is already in use`);
      checkoutAdapterProcess = spawn(process.execPath, ['.qa/checkout-adapter.mjs'], {
        cwd: root,
        env: {
          ...process.env,
          ...env,
          CRAYS_CHECKOUT_STATE: statePath,
          CRAYS_CHECKOUT_ADAPTER_PORT: String(checkoutPort),
          CRAYS_CHECKOUT_ADAPTER_PUBLIC_URL: `http://10.0.2.2:${checkoutPort}`,
        },
        stdio: 'inherit',
      });
      waitForHttp(checkoutAdapterProcess, checkoutPort, '/healthz', 'checkout adapter');
    }
    if (blossomAdapter) {
      const blossomPort = Number(env.CRAYS_BLOSSOM_PORT);
      if (portIsListening(blossomPort)) throw new Error(`Blossom adapter port ${blossomPort} is already in use`);
      rmSync(env.CRAYS_BLOSSOM_STATE, { force: true });
      blossomAdapterProcess = spawn(process.execPath, ['.qa/blossom-adapter.mjs'], { cwd: root, env: { ...process.env, ...env }, stdio: 'inherit' });
      waitForHttp(blossomAdapterProcess, blossomPort, '/healthz', 'Blossom adapter');
      run('adb', ['push', 'assets/branding/app-icon.png', '/sdcard/Pictures/crays-qa-feed.png'], env);
      run('adb', ['shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', 'file:///sdcard/Pictures/crays-qa-feed.png'], env);
    }
    const fixtureIdentity = loadKeys().users[qaUserIndex];
    const fixtureNsec = fixtureIdentity.nsec;
    run(process.env.MAESTRO_CLI || 'maestro', [
      'test',
      ...deviceArgs(),
      '-e', `RELAY_URL=ws://10.0.2.2:${proxyPort}`,
      '-e', `ROOM_ID=${state.room_id}`,
      '-e', `SERVICE_URL=http://10.0.2.2:${proxyPort}`,
      '-e', `INVITE_TOKEN=${state.invite_token}`,
      '-e', `QA_NSEC=${fixtureNsec}`,
      '-e', `QA_PROFILE_NPUB=${fixtureIdentity.npub}`,
      '-e', `JONAS_PUBKEY=${loadKeys().users[1].pub}`,
      '-e', `JONAS_FEED_POST_ID=${state.feed_ids?.[2] || ''}`,
      '-e', `MEMBERSHIP_AWARD_ID=${state.membership_award_id || ''}`,
      '-e', `EVENT_ID=${state.event_id || ''}`,
      '-e', `MEMBERSHIP_DEFINITION_ID=${state.membership_definition_id || ''}`,
      '-e', `PASS_AWARD_ID=${state.pass_award_id || ''}`,
      '-e', `EVENT_ACCESS_AWARD_ID=${state.event_access_award_id || ''}`,
      ...Object.entries(fixtureEnv).flatMap(([key, value]) => ['-e', `${key}=${value}`]),
      flow,
    ], env);
    run(process.execPath, ['.qa/relay-verify.mjs'], env);
    // Scenarios that never open the scenario room (e.g. returning login) must
    // pass verifyRoomDefinition: false — the app consumes no room definition there.
    if (verifyRoomDefinition) run(process.execPath, ['.qa/verify-room-definition-consumed.mjs'], env);
    for (const verifier of verifiers) run(process.execPath, [verifier], env);
    console.log(`QA PASS: ${scenario}`);
  } catch (error) {
    scenarioFailed = true;
    throw error;
  } finally {
    stopChild(checkoutAdapterProcess, 'checkout adapter');
    stopChild(blossomAdapterProcess, 'Blossom adapter');
    if (blossomAdapter) {
      try { run('adb', ['shell', 'rm', '-f', '/sdcard/Pictures/crays-qa-feed.png'], env); } catch { /* Emulator cleanup is best effort. */ }
    }
    stopProxy(testRoom);
    try {
      // The proxy owns normal teardown. A second idempotent sweep independently
      // proves that no fixture-authored non-deletion event survived it.
      run(process.execPath, ['.qa/relay-teardown.mjs', '--sweep'], env);
    } catch (error) {
      warnTeardownLeak(scenario, state, error);
      if (!scenarioFailed) throw error;
    }
  }
}

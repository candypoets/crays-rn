import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CONVERSATION_REPLY_TEXT,
  FEED_POST_TEXT,
  JOIN_VISIBLE_CONTEXT,
  JOIN_VISIBLE_INTENT,
  MESSAGE_REQUEST_TEXT,
  ROOM_ABOUT,
} from './flow-fixtures.mjs';
import { loadKeys, warnTeardownLeak } from './relay-lib.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);

// This host runs multiple emulators (other crays worktrees). Pin adb via
// ANDROID_SERIAL (honored by every bare `adb` call in the harness) and pass
// --device to maestro, which does not read ANDROID_SERIAL.
export const deviceArgs = () => (process.env.ANDROID_SERIAL ? ['--device', process.env.ANDROID_SERIAL] : []);

function run(command, args, env) {
  return execFileSync(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: 'inherit', maxBuffer: 64 * 1024 * 1024 });
}

// Flow-typed strings live in .qa/flow-fixtures.mjs so verifiers and flows
// cannot drift apart. Flows that use these QA_* vars can only run standalone
// with explicit `maestro test -e KEY=value` overrides.
const fixtureEnv = {
  QA_FEED_POST_TEXT: FEED_POST_TEXT,
  QA_JOIN_INTENT: JOIN_VISIBLE_INTENT,
  QA_JOIN_CONTEXT: JOIN_VISIBLE_CONTEXT,
  QA_MESSAGE_REQUEST_TEXT: MESSAGE_REQUEST_TEXT,
  QA_CONVERSATION_REPLY_TEXT: CONVERSATION_REPLY_TEXT,
  QA_ROOM_ABOUT: ROOM_ABOUT,
};

export function runRelayScreenScenario({ flow, scenario, verifiers = [], qaUserIndex = 0, bootstrapEnv = {}, verifyManifest = true }) {
  const statePath = `/tmp/qa-crays-${scenario}.json`;
  const env = { CRAYS_QA_STATE: statePath, CRAYS_QA_USER_INDEX: String(qaUserIndex), ...bootstrapEnv };
  run('adb', ['get-state'], env);
  run('adb', ['logcat', '-c'], env);
  let scenarioFailed = false;
  try {
    run(process.execPath, ['.qa/relay-bootstrap.mjs'], env);
    if (!existsSync(statePath)) throw new Error(`bootstrap did not write ${statePath}`);
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    const fixtureNsec = loadKeys().users[qaUserIndex].nsec;
    run(process.env.MAESTRO_CLI || 'maestro', [
      'test',
      ...deviceArgs(),
      '-e', `RELAY_URL=${state.emulator_relay_url}`,
      '-e', `ROOM_ID=${state.room_id}`,
      '-e', `SERVICE_URL=${state.emulator_base_url}`,
      '-e', `INVITE_TOKEN=${state.invite_token}`,
      '-e', `QA_NSEC=${fixtureNsec}`,
      '-e', `JONAS_PUBKEY=${loadKeys().users[1].pub}`,
      '-e', `MEMBERSHIP_AWARD_ID=${state.membership_award_id || ''}`,
      '-e', `EVENT_ID=${state.event_id || ''}`,
      '-e', `MEMBERSHIP_DEFINITION_ID=${state.membership_definition_id || ''}`,
      '-e', `PASS_AWARD_ID=${state.pass_award_id || ''}`,
      '-e', `EVENT_ACCESS_AWARD_ID=${state.event_access_award_id || ''}`,
      ...Object.entries(fixtureEnv).flatMap(([key, value]) => ['-e', `${key}=${value}`]),
      flow,
    ], env);
    run(process.execPath, ['.qa/relay-verify.mjs'], env);
    // Scenarios that never join the scenario room (e.g. returning login) must
    // pass verifyManifest: false — the app consumes no scenario manifest there.
    if (verifyManifest) run(process.execPath, ['.qa/verify-manifest-consumed.mjs'], env);
    for (const verifier of verifiers) run(process.execPath, [verifier], env);
    console.log(`QA PASS: ${scenario}`);
  } catch (error) {
    scenarioFailed = true;
    throw error;
  } finally {
    try {
      run(process.execPath, ['.qa/relay-teardown.mjs'], env);
    } catch (error) {
      let state;
      try { state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : undefined; } catch { state = undefined; }
      warnTeardownLeak(scenario, state, error);
      // A passing scenario keeps its PASS: the leak is surfaced, not fatal.
      // A failing scenario already exits non-zero from the rethrow above.
      if (scenarioFailed) process.exitCode = 1;
    }
  }
}

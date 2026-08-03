import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadKeys } from './relay-lib.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);

function run(command, args, env) {
  return execFileSync(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: 'inherit', maxBuffer: 64 * 1024 * 1024 });
}

export function runRelayScreenScenario({ flow, scenario, verifiers = [], qaUserIndex = 0 }) {
  const statePath = `/tmp/qa-crays-${scenario}.json`;
  const env = { CRAYS_QA_STATE: statePath, CRAYS_QA_USER_INDEX: String(qaUserIndex) };
  run('adb', ['get-state'], env);
  run('adb', ['logcat', '-c'], env);
  try {
    run(process.execPath, ['.qa/relay-bootstrap.mjs'], env);
    if (!existsSync(statePath)) throw new Error(`bootstrap did not write ${statePath}`);
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    const fixtureNsec = loadKeys().users[qaUserIndex].nsec;
    run(process.env.MAESTRO_CLI || 'maestro', [
      'test',
      '-e', `RELAY_URL=${state.emulator_relay_url}`,
      '-e', `ROOM_ID=${state.room_id}`,
      '-e', `SERVICE_URL=${state.emulator_base_url}`,
      '-e', `INVITE_TOKEN=${state.invite_token}`,
      '-e', `QA_NSEC=${fixtureNsec}`,
      '-e', `JONAS_PUBKEY=${loadKeys().users[1].pub}`,
      '-e', `MEMBERSHIP_AWARD_ID=${state.membership_award_id || ''}`,
      '-e', `PASS_AWARD_ID=${state.pass_award_id || ''}`,
      '-e', `EVENT_ACCESS_AWARD_ID=${state.event_access_award_id || ''}`,
      flow,
    ], env);
    run(process.execPath, ['.qa/relay-verify.mjs'], env);
    run(process.execPath, ['.qa/verify-manifest-consumed.mjs'], env);
    for (const verifier of verifiers) run(process.execPath, [verifier], env);
    console.log(`QA PASS: ${scenario}`);
  } finally {
    try { run(process.execPath, ['.qa/relay-teardown.mjs'], env); } catch (error) { console.error(`teardown failed for ${scenario}:`, error.message); }
  }
}

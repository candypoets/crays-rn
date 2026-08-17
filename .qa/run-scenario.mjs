#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { PROJECT_ROOT, runScreenScenario } from './qa-entry-lib.mjs';
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
import { scenarios } from './scenario-registry.mjs';

function usage() {
  console.log('Usage: node .qa/run-scenario.mjs <name>');
  console.log('       node .qa/run-scenario.mjs --list');
  console.log('       node .qa/run-scenario.mjs --list-all');
}

function list(includeExtended = false) {
  for (const [name, scenario] of Object.entries(scenarios)) {
    if (!includeExtended && scenario.tier !== 'journey') continue;
    console.log(`${name.padEnd(30)} ${scenario.tier.padEnd(9)} ${scenario.harness.padEnd(7)} ${scenario.owner.join(', ')}`);
  }
}

function runNode(script, args = []) {
  execFileSync(process.execPath, [script, ...args], {
    cwd: PROJECT_ROOT,
    env: process.env,
    stdio: 'inherit',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function checkPreflight(preflight, name) {
  if (!preflight) return;
  if (preflight !== 'test-room-build') throw new Error(`Unknown preflight ${preflight} for ${name}`);

  const buildEnvPath = `${PROJECT_ROOT}/.env.test-room-build`;
  const hasToken = existsSync(buildEnvPath)
    && /EXPO_PUBLIC_CRAYS_TEST_ROOM_INVITE_TOKEN=\S/.test(readFileSync(buildEnvPath, 'utf8'));
  if (!hasToken) {
    throw new Error(
      `${name} needs the Test Room dev fixture: run \`npm run test-room:publish\`, `
      + 'then restart Metro via `npm run start:maestro`.',
    );
  }
}

const name = process.argv[2];
if (name === '--list' || name === '--list-all') {
  list(name === '--list-all');
  process.exit(0);
}
if (!name || !scenarios[name]) {
  usage();
  if (name) console.error(`\nUnknown QA scenario: ${name}`);
  process.exit(2);
}

const scenario = scenarios[name];
checkPreflight(scenario.preflight, name);

if (scenario.harness === 'relay') {
  const { harness: _harness, owner: _owner, tier: _tier, ...config } = scenario;
  runRelayScreenScenario({ scenario: name, ...config });
} else if (scenario.harness === 'entry') {
  runScreenScenario({
    flow: scenario.flow,
    scenario: name,
    verify: scenario.verify
      ? () => runNode(scenario.verify.script, scenario.verify.args)
      : undefined,
  });
} else if (scenario.harness === 'custom') {
  runNode(scenario.executor);
} else {
  throw new Error(`Unsupported QA harness ${scenario.harness} for ${name}`);
}

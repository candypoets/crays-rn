#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { scenarios, screenContracts } from './scenario-registry.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const screenDir = resolve(root, 'docs/screens');
const flowDir = resolve(root, 'maestro/flows');

const documented = readdirSync(screenDir).filter((name) => name.endsWith('.md')).sort();
const registered = Object.keys(screenContracts).sort();
if (JSON.stringify(documented) !== JSON.stringify(registered)) {
  throw new Error(`Screen contract registry mismatch.\nDocumented: ${documented.join(', ')}\nRegistered: ${registered.join(', ')}`);
}

// Every screen owns deterministic Jest/RNTL coverage. Device journeys are
// registered separately and may cover several screens.
for (const [doc, testFile] of Object.entries(screenContracts)) {
  if (!existsSync(resolve(screenDir, doc))) throw new Error(`Missing screen spec: docs/screens/${doc}`);
  if (!existsSync(resolve(root, testFile))) throw new Error(`Mapped Jest test for ${doc} is missing: ${testFile}`);
}

const runFlowTargets = (name) => {
  const source = readFileSync(resolve(flowDir, name), 'utf8');
  return [...source.matchAll(/runFlow:\s*([\w./-]+\.yaml)/g)].map((match) => match[1]);
};
const reachesLaunch = (name, seen = new Set()) => {
  if (name === 'launch.yaml') return true;
  if (seen.has(name)) return false;
  seen.add(name);
  return runFlowTargets(name).some((target) => reachesLaunch(target.replace(/^.*\//, ''), seen));
};

for (const [name, scenario] of Object.entries(scenarios)) {
  if (!['entry', 'relay', 'custom'].includes(scenario.harness)) {
    throw new Error(`${name} has unsupported harness: ${scenario.harness}`);
  }
  if (!['journey', 'extended'].includes(scenario.tier)) {
    throw new Error(`${name} has unsupported tier: ${scenario.tier}`);
  }
  if (!Array.isArray(scenario.owner) || scenario.owner.length === 0) {
    throw new Error(`${name} must name at least one owning screen contract`);
  }
  for (const owner of scenario.owner) {
    if (!screenContracts[owner]) throw new Error(`${name} references unknown owner docs/screens/${owner}`);
  }

  const flowName = scenario.flow.replace(/^maestro\/flows\//, '');
  if (!existsSync(resolve(flowDir, flowName))) throw new Error(`${name} references missing ${scenario.flow}`);
  if (!reachesLaunch(flowName)) throw new Error(`${scenario.flow} does not transitively include maestro/flows/launch.yaml`);

  for (const verifier of scenario.verifiers ?? []) {
    if (!existsSync(resolve(root, verifier))) throw new Error(`${name} references missing verifier ${verifier}`);
  }
  if (scenario.verify && !existsSync(resolve(root, scenario.verify.script))) {
    throw new Error(`${name} references missing verifier ${scenario.verify.script}`);
  }
  if (scenario.harness === 'custom' && !existsSync(resolve(root, scenario.executor))) {
    throw new Error(`${name} references missing custom executor ${scenario.executor}`);
  }
}

const tierCounts = Object.values(scenarios).reduce(
  (counts, scenario) => ({ ...counts, [scenario.tier]: counts[scenario.tier] + 1 }),
  { journey: 0, extended: 0 },
);
if (tierCounts.journey > 12) {
  throw new Error(`Primary device QA grew to ${tierCounts.journey} journeys; consolidate before exceeding the 12-journey budget`);
}

const allowedQaExecutors = new Set([
  'qa-11c-join-relay-unavailable.mjs',
  'qa-28-switch-room.mjs',
  'qa-account-recovery.mjs',
  'qa-entry-bootstrap.mjs',
  'qa-entry-lib.mjs',
  'qa-entry-teardown.mjs',
  'qa-entry-verify.mjs',
  'qa-test-room.mjs',
]);
const qaExecutors = readdirSync(resolve(root, '.qa')).filter((name) => /^qa-.*\.mjs$/.test(name));
for (const file of qaExecutors) {
  if (!allowedQaExecutors.has(file)) {
    throw new Error(`Do not add per-screen QA wrappers (${file}); register the journey in scenario-registry.mjs`);
  }
}

console.log(
  `CRAYS QA CONTRACTS PASS: ${registered.length} screen specs have deterministic Jest coverage; `
  + `${tierCounts.journey} primary journeys and ${tierCounts.extended} targeted regressions are valid and launch-linked`,
);

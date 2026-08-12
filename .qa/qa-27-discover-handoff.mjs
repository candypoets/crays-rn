#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { PROJECT_ROOT, runScreenScenario } from './qa-entry-lib.mjs';

// The flow asserts the Developer/Test room section, which only renders when the
// invite token was compiled into the bundle (src/config/testRoom.ts). Fail fast
// instead of dying on an opaque Maestro "Developer not visible" assertion.
const buildEnvPath = `${PROJECT_ROOT}/.env.test-room-build`;
const hasToken = existsSync(buildEnvPath)
  && /EXPO_PUBLIC_CRAYS_TEST_ROOM_INVITE_TOKEN=\S/.test(readFileSync(buildEnvPath, 'utf8'));
if (!hasToken) {
  console.error(
    '27-discover-handoff needs the Test Room dev fixture: run `npm run test-room:publish`,'
    + ' then restart Metro via `npm run start:maestro` (it sources .env.test-room-build).',
  );
  process.exit(1);
}

runScreenScenario({
  flow: 'maestro/flows/27-discover-handoff.yaml',
  scenario: '27-discover-handoff',
  verify: () =>
    execFileSync(process.execPath, ['.qa/qa-entry-verify.mjs'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    }),
});

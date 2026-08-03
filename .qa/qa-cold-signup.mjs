#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

import { PROJECT_ROOT, runScreenScenario } from './qa-entry-lib.mjs';

runScreenScenario({
  flow: 'maestro/flows/cold-signup.yaml',
  scenario: 'cold-signup',
  verify: () =>
    execFileSync(process.execPath, ['.qa/qa-entry-verify.mjs'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    }),
});

#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

import { PROJECT_ROOT, runScreenScenario } from './qa-entry-lib.mjs';

runScreenScenario({
  flow: 'maestro/flows/07b-account-recovery.yaml',
  scenario: '07b-account-recovery',
  verify: () =>
    execFileSync(process.execPath, ['.qa/qa-entry-verify.mjs'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    }),
});

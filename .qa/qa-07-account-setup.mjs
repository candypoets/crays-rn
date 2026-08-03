#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

import { PROJECT_ROOT, runScreenScenario } from './qa-entry-lib.mjs';

runScreenScenario({
  flow: 'maestro/flows/07-account-setup.yaml',
  scenario: '07-account-setup',
  verify: () =>
    execFileSync(process.execPath, ['.qa/qa-entry-verify.mjs', '--profile-only'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    }),
});

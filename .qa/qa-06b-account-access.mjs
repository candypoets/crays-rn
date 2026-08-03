#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

import { PROJECT_ROOT, runScreenScenario } from './qa-entry-lib.mjs';

runScreenScenario({
  flow: 'maestro/flows/06b-account-access.yaml',
  scenario: '06b-account-access',
  verify: () =>
    execFileSync(process.execPath, ['.qa/qa-entry-verify.mjs', '--identity-only'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    }),
});

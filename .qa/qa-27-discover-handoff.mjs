#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

import { PROJECT_ROOT, runScreenScenario } from './qa-entry-lib.mjs';

runScreenScenario({
  flow: 'maestro/flows/27-discover-handoff.yaml',
  scenario: '27-discover-handoff',
  verify: () =>
    execFileSync(process.execPath, ['.qa/qa-entry-verify.mjs'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    }),
});

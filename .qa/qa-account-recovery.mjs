#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

import {
  bootstrapEntryQa,
  PROJECT_ROOT,
  teardownEntryQa,
} from './qa-entry-lib.mjs';
import { loadKeys } from './relay-lib.mjs';

const scenario = 'account-recovery';
const qaIdentity = loadKeys().users[0];
const deviceArgs = process.env.ANDROID_SERIAL ? ['--device', process.env.ANDROID_SERIAL] : [];

bootstrapEntryQa(scenario);
try {
  execFileSync(
    process.env.MAESTRO_CLI || 'maestro',
    [
      'test',
      ...deviceArgs,
      '-e',
      `QA_NSEC=${qaIdentity.nsec}`,
      'maestro/flows/account-recovery.yaml',
    ],
    { cwd: PROJECT_ROOT, env: process.env, maxBuffer: 64 * 1024 * 1024, stdio: 'inherit' },
  );
  execFileSync(process.execPath, ['.qa/verify-account-recovery.mjs'], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, QA_EXPECTED_PUBKEY: qaIdentity.pub },
    stdio: 'inherit',
  });
  console.log(`QA PASS: ${scenario}`);
} finally {
  teardownEntryQa();
}

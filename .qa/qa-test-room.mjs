#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { loadKeys } from './relay-lib.mjs';

const statePath = '/tmp/qa-crays-test-room-card.json';
const pidPath = '/tmp/qa-crays-test-room-card.pid';
const qaUserIndex = 3;
const env = {
  ...process.env,
  CRAYS_TEST_ROOM_STATE: statePath,
  CRAYS_TEST_ROOM_PID: pidPath,
  CRAYS_QA_STATE: statePath,
  CRAYS_QA_USER_INDEX: String(qaUserIndex),
};

function run(command, args) {
  return execFileSync(command, args, { cwd: process.cwd(), env, stdio: 'inherit', maxBuffer: 64 * 1024 * 1024 });
}

function waitForReady(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Test Room did not become ready within 120 seconds')), 120_000);
    let output = '';
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      output += text;
      if (output.includes('TEST ROOM READY')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Test Room exited before readiness with code ${code}`));
    });
  });
}

function stopChild(child) {
  if (child.exitCode !== null) return Promise.resolve();
  child.kill('SIGTERM');
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 120_000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

run('adb', ['get-state']);
run('adb', ['logcat', '-c']);
const testRoom = spawn(process.execPath, ['.qa/test-room.mjs'], { cwd: process.cwd(), env, stdio: ['ignore', 'pipe', 'pipe'] });
try {
  await waitForReady(testRoom);
  if (!existsSync(statePath)) throw new Error(`Test Room did not write ${statePath}`);
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const fixtureNsec = loadKeys().users[qaUserIndex].nsec;
  run(process.env.MAESTRO_CLI || 'maestro', [
    'test',
    '-e', `QA_NSEC=${fixtureNsec}`,
    'maestro/flows/test-room.yaml',
  ]);
  run(process.execPath, ['.qa/relay-verify.mjs']);
  run(process.execPath, ['.qa/verify-manifest-consumed.mjs']);
  run(process.execPath, ['.qa/verify-quiet-entry.mjs']);
  console.log(`QA PASS: development-test-room (${state.room_id})`);
} finally {
  await stopChild(testRoom);
}

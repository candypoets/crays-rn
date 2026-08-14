#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { JOIN_VISIBLE_CONTEXT, JOIN_VISIBLE_INTENT, MESSAGE_REQUEST_TEXT, TEST_ROOM_QA_PROFILE_NAME } from './flow-fixtures.mjs';
import { loadKeys } from './relay-lib.mjs';
import { deviceArgs } from './relay-screen-scenario.mjs';

const statePath = '/tmp/qa-crays-test-room-card.json';
const pidPath = '/tmp/qa-crays-test-room-card.pid';
const qaUserIndex = 3;
const env = {
  ...process.env,
  CRAYS_TEST_ROOM_STATE: statePath,
  CRAYS_TEST_ROOM_PID: pidPath,
  CRAYS_QA_STATE: statePath,
  CRAYS_QA_USER_INDEX: String(qaUserIndex),
  // User 3 starts outside the fixture membership. Visible entry must redeem
  // the direct Test Room invite before profile and presence publication.
  CRAYS_QA_PREAUTHORIZE: '0',
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
  if (!state.invite_token) throw new Error('Test Room did not mint its direct invite credential');
  const fixtureNsec = loadKeys().users[qaUserIndex].nsec;
  run(process.env.MAESTRO_CLI || 'maestro', [
    'test',
    ...deviceArgs(),
    '-e', `QA_NSEC=${fixtureNsec}`,
    '-e', `SERVICE_URL=${state.base_url}`,
    '-e', `RELAY_URL=${state.relay_url}`,
    '-e', `ROOM_ID=${state.room_id}`,
    '-e', `INVITE_TOKEN=${state.invite_token}`,
    '-e', `QA_JOIN_INTENT=${JOIN_VISIBLE_INTENT}`,
    '-e', `QA_JOIN_CONTEXT=${JOIN_VISIBLE_CONTEXT}`,
    '-e', `QA_PROFILE_NAME=${TEST_ROOM_QA_PROFILE_NAME}`,
    '-e', `QA_MESSAGE_REQUEST_TEXT=${MESSAGE_REQUEST_TEXT}`,
    'maestro/flows/test-room.yaml',
  ]);
  run(process.execPath, ['.qa/relay-verify.mjs']);
  run(process.execPath, ['.qa/verify-room-definition-consumed.mjs']);
  run(process.execPath, ['.qa/verify-test-room-invite-redeemed.mjs']);
  run(process.execPath, ['.qa/verify-visible-entry.mjs']);
  run(process.execPath, ['.qa/verify-message-request.mjs']);
  console.log(`QA PASS: test-build-room-visible-invite (${state.room_id})`);
} finally {
  await stopChild(testRoom);
}

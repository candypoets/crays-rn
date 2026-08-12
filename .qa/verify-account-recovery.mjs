#!/usr/bin/env node
import { parseMarkers, readLogcat, readQaState } from './qa-entry-lib.mjs';

const state = readQaState();
const logcat = readLogcat();
const seededIdentities = parseMarkers(logcat, '[crays-qa-identity]');
const createdIdentities = parseMarkers(logcat, '[onboarding-identity]');
const expectedPubkey = process.env.QA_EXPECTED_PUBKEY;

if (!expectedPubkey || !/^[0-9a-f]{64}$/.test(expectedPubkey)) {
  throw new Error('QA_EXPECTED_PUBKEY must be a 32-byte hex public key');
}
if (seededIdentities.length !== 1 || seededIdentities[0]?.pubkey !== expectedPubkey) {
  throw new Error(`Recovery did not preserve the exact seeded identity: ${JSON.stringify(seededIdentities)}`);
}
if (createdIdentities.length !== 0) {
  throw new Error(`Account recovery unexpectedly created a replacement identity: ${JSON.stringify(createdIdentities)}`);
}
if (parseMarkers(logcat, '[onboarding-profile]').length !== 0) {
  throw new Error('Account recovery unexpectedly created or replaced a profile');
}
if (parseMarkers(logcat, '[onboarding-complete]').length !== 0) {
  throw new Error('Account recovery unexpectedly completed onboarding');
}

console.log(`ok: ${state.scenario} preserved the exact seeded identity`);
console.log('ok: account recovery ran without relay provisioning or recovery side effects');

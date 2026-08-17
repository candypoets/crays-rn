#!/usr/bin/env node
import { parseMarkers, readLogcat, readQaState } from './qa-entry-lib.mjs';

const state = readQaState();
const logcat = readLogcat();
const identities = parseMarkers(logcat, '[onboarding-identity]');
const expectedPubkey = process.env.QA_EXPECTED_PUBKEY;
const secret = process.env.QA_NSEC;

if (!expectedPubkey || !/^[0-9a-f]{64}$/.test(expectedPubkey)) {
  throw new Error('QA_EXPECTED_PUBKEY must be a 32-byte hex public key');
}
if (identities.length !== 1 || identities[0]?.pubkey !== expectedPubkey) {
  throw new Error(`Existing-identity login did not import exactly the expected public identity: ${JSON.stringify(identities)}`);
}
if (identities[0]?.signer !== 'imported-privkey') {
  throw new Error(`Existing-identity login recorded the wrong signer custody: ${JSON.stringify(identities[0])}`);
}
if (secret && logcat.includes(secret)) {
  throw new Error('Existing-identity login exposed the imported nsec in Android logs');
}
if (parseMarkers(logcat, '[onboarding-profile]').length !== 0) {
  throw new Error('Existing-identity login created a profile before the user confirmed a room-facing name');
}
if (parseMarkers(logcat, '[onboarding-complete]').length !== 0) {
  throw new Error('Existing-identity login completed onboarding before the profile step');
}

console.log(`ok: ${state.scenario} imported exactly one existing Nostr identity`);
console.log('ok: the nsec stayed out of UI verification markers and logs');

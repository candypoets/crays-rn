#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools';

import { parseMarkers, readLogcat, readQaState } from './qa-entry-lib.mjs';

const identityOnly = process.argv.includes('--identity-only');
const requireComplete = !process.argv.includes('--profile-only');
const state = readQaState();
const logcat = readLogcat();
const identities = parseMarkers(logcat, '[onboarding-identity]');
if (identities.length !== 1 || !/^[0-9a-f]{64}$/.test(identities[0]?.pubkey)) {
  throw new Error(`Expected exactly one valid identity marker, received ${identities.length}`);
}

if (identityOnly) {
  if (parseMarkers(logcat, '[onboarding-profile]').length !== 0) {
    throw new Error('Account-access scenario unexpectedly created a profile');
  }
  if (parseMarkers(logcat, '[onboarding-complete]').length !== 0) {
    throw new Error('Account-access scenario unexpectedly completed onboarding');
  }
  console.log(`ok: ${state.scenario} created exactly one local identity`);
  process.exit(0);
}

const profiles = parseMarkers(logcat, '[onboarding-profile]');
if (profiles.length !== 1) {
  throw new Error(`Expected exactly one profile marker, received ${profiles.length}`);
}
const profileRecord = profiles[0];
const event = profileRecord.event;

if (event?.kind !== 0) throw new Error(`Expected signed kind 0, received ${event?.kind}`);
if (!verifyEvent(event)) throw new Error('The onboarding kind-0 signature is invalid');
if (!/^[0-9a-f]{64}$/.test(event.pubkey)) throw new Error('Profile pubkey is not 32-byte hex');

const content = JSON.parse(event.content);
if (content.name !== 'QA Alex' || content.display_name !== 'QA Alex') {
  throw new Error(`Expected QA Alex profile content, received ${event.content}`);
}
if (profileRecord.relayCount !== 0) {
  throw new Error(`Onboarding opened ${profileRecord.relayCount} relay connection(s)`);
}
if (profileRecord.subscriptionCount !== 0) {
  throw new Error(`Onboarding leaked ${profileRecord.subscriptionCount} subscription(s)`);
}

if (requireComplete) {
  const completions = parseMarkers(logcat, '[onboarding-complete]');
  if (completions.length !== 1) {
    throw new Error(`Expected exactly one completion marker, received ${completions.length}`);
  }
  const completion = completions[0];
  if (completion.recovery !== 'device-only') {
    throw new Error(`Unexpected recovery state: ${completion.recovery}`);
  }
} else if (parseMarkers(logcat, '[onboarding-complete]').length !== 0) {
  throw new Error('Profile scenario unexpectedly completed onboarding');
}

console.log(`ok: ${state.scenario} signed a valid local kind-0 for ${event.pubkey}`);
console.log('ok: onboarding opened no relay connections or subscriptions');
if (requireComplete) console.log('ok: device-only recovery consequence was recorded');

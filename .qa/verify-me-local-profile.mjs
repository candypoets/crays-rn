#!/usr/bin/env node
import { TEST_ROOM_QA_PROFILE_NAME } from './flow-fixtures.mjs';
import { parseMarkers, readLogcat } from './qa-entry-lib.mjs';
import { assert, loadKeys } from './relay-lib.mjs';

const qaUserIndex = Number(process.env.CRAYS_QA_USER_INDEX || 0);
const expected = loadKeys().users[qaUserIndex];
const records = parseMarkers(readLogcat(), '[crays-me-profile]');
assert(records.length > 0, 'Me emitted a validated public-only local profile marker');

const profile = records.at(-1);
assert(profile.pubkey === expected.pub, 'Me profile pubkey matches the deterministic protected identity');
assert(profile.npub === expected.npub, 'Me profile npub matches the deterministic protected identity');
assert(profile.displayName === TEST_ROOM_QA_PROFILE_NAME, 'Me profile name matches the signed local kind-0 fixture');
assert(profile.custody === 'device-only', 'Me reports device-only custody without provider-login claims');
assert(profile.setupComplete === true, 'Me reads a completed local account');
assert(profile.verified === true, 'Me projected only a validated identity and signed profile');
assert(!Object.hasOwn(profile, 'nsec'), 'Me profile marker contains no protected secret');

console.log('Me local profile verification passed.');

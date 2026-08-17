import assert from 'node:assert/strict';
import test from 'node:test';

import { fixtureAddressD, fixtureEventIdsFromState, fixtureUsersAtOffset, isFixtureCleanupTarget } from './relay-lib.mjs';

const issuer = 'a'.repeat(64);
const fixtureUser = 'b'.repeat(64);
const externalVisitor = 'c'.repeat(64);
const admin = 'd'.repeat(64);
const signerPubkeys = new Set([issuer, fixtureUser, admin]);
const event = (overrides = {}) => ({ kind: 8, pubkey: issuer, tags: [], ...overrides });

test('fixture cleanup removes only issuer awards addressed to fixture identities', () => {
  assert.equal(isFixtureCleanupTarget(event({ tags: [['p', fixtureUser]] }), signerPubkeys, issuer), true);
  assert.equal(isFixtureCleanupTarget(event({ tags: [['p', externalVisitor], ['i', 'invite-redemption:visitor']] }), signerPubkeys, issuer), false);
  assert.equal(isFixtureCleanupTarget(event({ pubkey: admin, kind: 30312 }), signerPubkeys, issuer), true);
  assert.equal(isFixtureCleanupTarget(event({ pubkey: admin, kind: 5 }), signerPubkeys, issuer), false);
});

test('published Test Room protection extracts only persisted event ids', () => {
  const roomDefinition = '1'.repeat(64);
  const profile = '2'.repeat(64);
  const presence = '3'.repeat(64);
  const venueProfile = '4'.repeat(64);
  assert.deepEqual(
    fixtureEventIdsFromState({
      id: 'coordinator-relay-id',
      operator_pubkey: 'a'.repeat(64),
      room_definition_id: roomDefinition,
      venue_profile_id: venueProfile,
      profile_ids: [profile, 'invalid'],
      presence_ids: [presence, profile],
    }),
    [roomDefinition, venueProfile, presence, profile],
  );
});

test('ephemeral fixture coordinates and identities stay isolated from the published Test Room', () => {
  assert.equal(fixtureAddressD('rooftop-jazz', 'crays-qa-test-room', false), 'crays-qa-test-room:rooftop-jazz');
  assert.equal(fixtureAddressD('rooftop-jazz', 'crays-test-room', true), 'rooftop-jazz');
  const users = Array.from({ length: 25 }, (_, index) => ({ index }));
  assert.deepEqual(fixtureUsersAtOffset(users, 20), [{ index: 20 }, { index: 21 }, { index: 22 }]);
  assert.throws(() => fixtureUsersAtOffset(users, 24), /cannot select 3 fixture users/);
});

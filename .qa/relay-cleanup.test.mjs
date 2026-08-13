import assert from 'node:assert/strict';
import test from 'node:test';

import { isFixtureCleanupTarget } from './relay-lib.mjs';

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

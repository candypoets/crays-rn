#!/usr/bin/env node
import {
  clearState,
  deleteFixtureEvents,
  ensureFixtureCleanupCapability,
  fixtureSignerMap,
  getRelaySecrets,
  loadKeys,
  makePool,
  queryFixtureEvents,
  readState,
  requireCoordinator,
  reserveOrReuseRelay,
} from './relay-lib.mjs';

const keys = loadKeys();
await requireCoordinator();
const state = readState();
if (!state?.id && !process.argv.includes('--sweep')) {
  throw new Error('no Crays QA relay state; use --sweep for reserved-relay fixture recovery');
}

// The relay is permanent. Teardown only removes fixture-authored events and
// never calls the coordinator DELETE route or touches a Docker volume.
const relay = await reserveOrReuseRelay(keys);
if (state?.id && state.id !== relay.id) throw new Error(`scenario state targets ${state.id}, not reserved relay ${relay.id}`);
const secrets = await getRelaySecrets(relay.id, keys);
const badgeIssuerSecret = secrets.badge_issuer_secret_key;
const communityRoot = relay.required_badge.split(':')[1];
const pool = makePool();

try {
  const { signers, badgeIssuerPubkey } = fixtureSignerMap(keys, badgeIssuerSecret);
  const existing = await queryFixtureEvents(pool, relay.relay_url, signers, badgeIssuerPubkey);
  const ordinaryAuthors = existing
    .map((event) => event.pubkey)
    .filter((pubkey) => pubkey !== keys.admin.pub && pubkey !== badgeIssuerPubkey);
  if (existing.length) {
    await ensureFixtureCleanupCapability(pool, relay.relay_url, keys, badgeIssuerSecret, ordinaryAuthors);
  }
  const result = await deleteFixtureEvents({
    pool,
    relayUrl: relay.relay_url,
    keys,
    badgeIssuerSecret,
    communityRoot,
    label: process.argv.includes('--sweep') ? 'reserved-relay recovery sweep' : 'scenario teardown',
  });
  console.log(`ok - reserved relay retained; removed ${result.deleted} fixture event(s)`);
} finally {
  pool.close([relay.relay_url]);
}

clearState();
console.log(process.argv.includes('--sweep') ? 'CRAYS RESERVED RELAY SWEEP PASS' : 'CRAYS RELAY TEARDOWN PASS');

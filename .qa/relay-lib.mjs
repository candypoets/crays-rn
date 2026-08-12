import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import WebSocket from 'ws';
import { finalizeEvent, getPublicKey } from 'nostr-tools';
import { SimplePool, useWebSocketImplementation } from 'nostr-tools/pool';

// nostr-tools clears its `onerror` callback when a pool is closed. Node's `ws`
// can still emit a late transport error from an in-flight TCP/TLS connection
// after that cleanup; without an EventEmitter listener, Node treats it as an
// uncaught exception. Keep a no-op listener alongside nostr-tools' callback so
// a verifier reports its own query/timeout result instead of crashing during
// connection teardown.
class QaWebSocket extends WebSocket {
  constructor(...args) {
    super(...args);
    this.on('error', () => {});
  }
}

useWebSocketImplementation(QaWebSocket);

export const COORDINATOR_URL = (process.env.COORDINATOR_URL || 'https://coordinator.nuts.cash').replace(/\/$/, '');
export const STATE_PATH = process.env.CRAYS_QA_STATE || '/tmp/qa-crays-room.json';
export const DEFAULT_KEYS_JSON = '/root/code/strfry-badge-node/test/env/keys.json';
export const RESERVED_RELAY_DOMAIN = process.env.CRAYS_QA_RELAY_DOMAIN || 'crays-test.relays.nuts.cash';
export const FIXTURE_CAPABILITY_D = 'crays-qa-write-capabilities';
export const FIXTURE_WRITE_KINDS = [0, 1, 4, 5, 10312, 1984, 27236, 31925];

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const nowSeconds = () => Math.floor(Date.now() / 1000);

export function assert(condition, label) {
  if (!condition) throw new Error(`ASSERT FAILED: ${label}`);
  console.log(`ok - ${label}`);
}

function normalizeKey(value) {
  return {
    priv: value.priv || value.sec_hex,
    pub: value.pub || value.pub_hex,
    nsec: value.nsec,
    npub: value.npub,
  };
}

export function loadKeys(path = process.env.KEYS_JSON || DEFAULT_KEYS_JSON) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const keys = { _path: path };
  for (const [name, value] of Object.entries(raw)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && (value.priv || value.sec_hex)) {
      keys[name] = normalizeKey(value);
    }
  }
  if (Array.isArray(raw.users)) keys.users = raw.users.map(normalizeKey);
  return keys;
}

export function signEvent(template, privHex) {
  return finalizeEvent(
    { created_at: nowSeconds(), content: '', tags: [], ...template },
    Uint8Array.from(Buffer.from(privHex, 'hex')),
  );
}

export function nip98Header(url, method, body, privHex) {
  const payload = createHash('sha256').update(body || '').digest('hex');
  const event = signEvent(
    { kind: 27235, tags: [['u', url], ['method', method], ['payload', payload]] },
    privHex,
  );
  return `Nostr ${Buffer.from(JSON.stringify(event), 'utf8').toString('base64url')}`;
}

export async function requireCoordinator() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${COORDINATOR_URL}/healthz`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) return;
    } catch {
      // The deployed health route can briefly lag while authenticated API and
      // relay traffic remain healthy. Retry before declaring infrastructure
      // unavailable.
    }
    if (attempt < 2) await sleep(750);
  }
  throw new Error(`Crays QA requires the Nuts coordinator at ${COORDINATOR_URL}; see .qa/README.md.`);
}

async function coordinatorApi(path, method, keys, body) {
  const url = `${COORDINATOR_URL}${path}`;
  const bodyText = body === undefined ? '' : JSON.stringify(body);
  const response = await fetch(url, {
    method,
    headers: {
      authorization: nip98Header(url, method, bodyText, keys.admin.priv),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: method === 'GET' || method === 'DELETE' ? undefined : bodyText,
  });
  if (!response.ok) throw new Error(`coordinator ${method} ${path} -> ${response.status}: ${await response.text()}`);
  if (response.status === 204) return undefined;
  return response.json();
}

export const createRelay = (payload, keys) => coordinatorApi('/relays', 'POST', keys, payload);
export const getRelay = (id, keys) => coordinatorApi(`/relays/${id}`, 'GET', keys);
export const getRelaySecrets = (id, keys) => coordinatorApi(`/relays/${id}/secrets`, 'GET', keys);
export const deleteRelay = (id, keys) => coordinatorApi(`/relays/${id}`, 'DELETE', keys);
export const listRelays = (keys) => coordinatorApi('/relays', 'GET', keys);

/**
 * The deployed coordinator rate-limits creation per owner. Relay-backed Crays
 * QA therefore owns one reserved relay and only creates it if it is genuinely
 * absent. Never create a per-scenario relay on the live coordinator.
 */
export async function reserveOrReuseRelay(keys) {
  const relays = await listRelays(keys);
  let relay = relays.find((candidate) => candidate.domain === RESERVED_RELAY_DOMAIN);
  if (!relay) {
    const created = await createRelay(
      {
        name: 'crays-test',
        description: 'Crays RN reserved QA relay (live coordinator). Do not delete.',
        domain_label: 'crays-test',
        admin_pubkeys: [keys.admin.pub],
        badge_d: 'members',
      },
      keys,
    );
    relay = await waitRelayRunning(created.id, keys);
    assert(true, `created reserved relay ${RESERVED_RELAY_DOMAIN}`);
  } else if (relay.status !== 'running') {
    relay = await waitRelayRunning(relay.id, keys);
  }
  assert(relay.domain === RESERVED_RELAY_DOMAIN, `reusing reserved relay ${RESERVED_RELAY_DOMAIN}`);
  assert(relay.relay_url === `wss://${RESERVED_RELAY_DOMAIN}`, 'reserved relay exposes its deployed WSS URL');
  return relay;
}

export async function waitRelayRunning(id, keys, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const relay = await getRelay(id, keys);
    if (relay.status === 'running') return relay;
    if (relay.status !== 'creating') throw new Error(`relay ${id} entered ${relay.status}`);
    await sleep(1500);
  }
  throw new Error(`relay ${id} did not become ready`);
}

export function makePool() {
  return new SimplePool();
}

export const DEFAULT_QUERY_TIMEOUT_MS = 15_000;
export const ABSENCE_SETTLE_MS = 4_000;

/**
 * Poll a relay filter until `until(events)` returns a truthy value. Positive
 * verifiers must use this instead of a single querySync: relays can lag a
 * confirmed write by a few seconds, and one-shot queries flake the suite.
 * Returns { events, result } from the successful poll.
 */
export async function queryUntil(pool, relayUrl, filter, until, label, timeoutMs = DEFAULT_QUERY_TIMEOUT_MS, intervalMs = 750) {
  const deadline = Date.now() + timeoutMs;
  let events = [];
  for (;;) {
    events = await pool.querySync([relayUrl], filter);
    const result = until(events);
    if (result) return { events, result };
    if (Date.now() >= deadline) break;
    await sleep(intervalMs);
  }
  throw new Error(`relay condition not met within ${timeoutMs}ms: ${label} (last poll saw ${events.length} event(s))`);
}

/**
 * Negative verifiers must wait before asserting ABSENCE: a lagging write that
 * has not propagated yet would otherwise produce a false pass.
 */
export async function settleBeforeAbsence(label) {
  await sleep(ABSENCE_SETTLE_MS);
  console.log(`ok - settled ${ABSENCE_SETTLE_MS}ms before absence check so a lagging write cannot fake it: ${label}`);
}

/** Surface a failed fixture teardown without implying the reserved relay should be deleted. */
export function warnTeardownLeak(scenario, state, error) {
  const relay = state?.name ? `${state.name} (id ${state.id})` : 'unknown relay (state file missing)';
  console.error(`\n*** QA TEARDOWN FAILED for ${scenario} ***`);
  console.error(`*** reserved relay may contain fixture leftovers: ${relay}`);
  console.error(`*** cause: ${String(error?.message || error).split('\n')[0]}`);
  console.error('*** recover once no other QA run is live with: node .qa/relay-teardown.mjs --sweep');
  console.error('*** do not delete the reserved relay or its volume\n');
}

export async function publishUntilStored(pool, relayUrl, event, label, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let lastRejection;
  while (Date.now() < deadline) {
    const outcomes = await Promise.allSettled(pool.publish([relayUrl], event));
    const rejected = outcomes.find((outcome) => outcome.status === 'rejected');
    if (rejected) lastRejection = String(rejected.reason?.message || rejected.reason);
    await sleep(750);
    const stored = await pool.get([relayUrl], { ids: [event.id] });
    if (stored?.id === event.id) {
      assert(true, label);
      return stored;
    }
  }
  throw new Error(`relay never round-tripped ${label}${lastRejection ? `; last rejection: ${lastRejection}` : ''}`);
}

export function fixtureSignerMap(keys, badgeIssuerSecret) {
  if (!/^[0-9a-f]{64}$/i.test(badgeIssuerSecret || '')) throw new Error('fixture cleanup requires the reserved relay badge issuer secret');
  const signers = new Map();
  const add = (key) => {
    if (key?.pub && key?.priv) signers.set(key.pub, key.priv);
  };
  add(keys.admin);
  add(keys.issuer);
  for (const user of keys.users || []) add(user);
  const badgeIssuerPubkey = getPublicKey(Uint8Array.from(Buffer.from(badgeIssuerSecret, 'hex')));
  signers.set(badgeIssuerPubkey, badgeIssuerSecret);
  return { signers, badgeIssuerPubkey };
}

export async function queryFixtureEvents(pool, relayUrl, signers) {
  const events = await pool.querySync([relayUrl], { authors: [...signers.keys()], limit: 5000 });
  // NIP-09 tombstones are the cleanup proof and may remain stored. They are
  // never cleanup targets themselves, otherwise every sweep creates another
  // unbounded generation of tombstones.
  return events.filter((event) => event.kind !== 5);
}

/**
 * Publish a UI-invisible priced definition and awards that grant fixture
 * identities the kinds exercised by the harness, including kind 5 so each
 * original author can remove its own events under NIP-09.
 */
export async function ensureFixtureCleanupCapability(pool, relayUrl, keys, badgeIssuerSecret, recipientPubkeys) {
  const address = `30009:${keys.admin.pub}:${FIXTURE_CAPABILITY_D}`;
  const definition = signEvent(
    {
      kind: 30009,
      tags: [
        ['d', FIXTURE_CAPABILITY_D],
        ['t', 'qa_capability'],
        ['name', 'Crays QA fixture writes'],
        ['price', '0', 'EUR'],
        ...FIXTURE_WRITE_KINDS.map((kind) => ['permission', String(kind), 'write']),
      ],
    },
    keys.admin.priv,
  );
  await publishUntilStored(pool, relayUrl, definition, 'temporary QA capability definition');
  await sleep(1000);

  const awards = [];
  for (const pubkey of [...new Set(recipientPubkeys)].filter(Boolean)) {
    const award = signEvent(
      { kind: 8, tags: [['a', address], ['p', pubkey], ['t', '30009'], ['t', 'qa_capability']] },
      badgeIssuerSecret,
    );
    await publishUntilStored(pool, relayUrl, award, `temporary QA capability award for ${pubkey.slice(0, 8)}`);
    awards.push(award);
  }
  await sleep(1000);
  return { definition, awards };
}

/**
 * Delete every non-kind-5 fixture event with a kind-5 event signed by that
 * event's original author. Ordinary fixture identities are deleted first;
 * issuer awards next; the admin capability definition last.
 */
export async function deleteFixtureEvents({ pool, relayUrl, keys, badgeIssuerSecret, communityRoot, excludeIds = [], label }) {
  const { signers, badgeIssuerPubkey } = fixtureSignerMap(keys, badgeIssuerSecret);
  if (signers.has(communityRoot)) throw new Error('fixture cleanup signer set unexpectedly contains the community root');
  const excluded = new Set(excludeIds);
  const targets = (await queryFixtureEvents(pool, relayUrl, signers)).filter((event) => !excluded.has(event.id));
  if (!targets.length) {
    assert(true, `${label}: no fixture-authored leftovers`);
    return { deleted: 0, deletionIds: [] };
  }

  const byAuthor = new Map();
  for (const event of targets) {
    const authored = byAuthor.get(event.pubkey) || [];
    authored.push(event);
    byAuthor.set(event.pubkey, authored);
  }
  const orderedAuthors = [...byAuthor.keys()].sort((left, right) => {
    const rank = (pubkey) => pubkey === keys.admin.pub ? 2 : pubkey === badgeIssuerPubkey ? 1 : 0;
    return rank(left) - rank(right);
  });
  const deletionIds = [];
  for (const author of orderedAuthors) {
    const authored = byAuthor.get(author);
    const privateKey = signers.get(author);
    if (!privateKey) throw new Error(`${label}: no private key for fixture author ${author}`);
    const deletion = signEvent(
      {
        kind: 5,
        content: `Crays QA cleanup: ${label}`,
        tags: authored.map((event) => ['e', event.id]),
      },
      privateKey,
    );
    try {
      await publishUntilStored(pool, relayUrl, deletion, `${label} deletion by ${author.slice(0, 8)}`, 15_000);
    } catch (error) {
      throw new Error(`${label}: relay rejected fixture-author deletion by ${author}: ${error.message}`);
    }
    deletionIds.push(deletion.id);
  }

  await settleBeforeAbsence(`${label}: fixture targets`);
  await queryUntil(
    pool,
    relayUrl,
    { ids: targets.map((event) => event.id), limit: Math.max(100, targets.length) },
    (events) => events.length === 0,
    `${label}: all ${targets.length} fixture-authored targets were deleted`,
  );
  const remaining = (await queryFixtureEvents(pool, relayUrl, signers)).filter((event) => !excluded.has(event.id));
  assert(remaining.length === 0, `${label}: reserved relay has no non-deletion fixture events outside the protected run capability`);
  return { deleted: targets.length, deletionIds };
}

export function emulatorUrl(url) {
  return url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2');
}

export function readState() {
  if (!existsSync(STATE_PATH)) return undefined;
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

export function writeState(state) {
  writeFileSync(STATE_PATH, `${JSON.stringify({ ...state, written_at: new Date().toISOString() }, null, 2)}\n`, { mode: 0o600 });
  chmodSync(STATE_PATH, 0o600);
  assert(true, `state written to ${STATE_PATH}`);
}

export function clearState() {
  rmSync(STATE_PATH, { force: true });
}

export function removeRelayVolume(id) {
  try {
    execFileSync('docker', ['volume', 'rm', '-f', `strfry-badge-data-${id}`], { stdio: 'pipe' });
    console.log(`ok - removed strfry-badge-data-${id}`);
  } catch {
    console.log(`warn - volume strfry-badge-data-${id} already absent`);
  }
}

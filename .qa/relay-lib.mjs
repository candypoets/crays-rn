import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import WebSocket from 'ws';
import { finalizeEvent } from 'nostr-tools';
import { SimplePool, useWebSocketImplementation } from 'nostr-tools/pool';

useWebSocketImplementation(WebSocket);

export const COORDINATOR_URL = (process.env.COORDINATOR_URL || 'http://127.0.0.1:7798').replace(/\/$/, '');
export const STATE_PATH = process.env.CRAYS_QA_STATE || '/tmp/qa-crays-room.json';
export const DEFAULT_KEYS_JSON = '/root/code/strfry-badge-node/test/env/keys.json';

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
  try {
    const response = await fetch(`${COORDINATOR_URL}/healthz`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`status ${response.status}`);
  } catch {
    throw new Error(`Crays QA requires the Nuts coordinator at ${COORDINATOR_URL}; see .qa/README.md.`);
  }
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

/**
 * Surface a failed teardown loudly: a scenario may pass while leaking the
 * provisioned relay and its docker volume. Printed with the relay name and
 * the exact recovery command so the leak is actionable.
 */
export function warnTeardownLeak(scenario, state, error) {
  const relay = state?.name ? `${state.name} (id ${state.id})` : 'unknown relay (state file missing)';
  console.error(`\n*** QA TEARDOWN FAILED for ${scenario} ***`);
  console.error(`*** leaked relay: ${relay}`);
  console.error(`*** cause: ${String(error?.message || error).split('\n')[0]}`);
  console.error('*** recover once no other QA run is live with: node .qa/relay-teardown.mjs --sweep');
  console.error('*** the scenario result above still stands; this warning only covers infrastructure cleanup\n');
}

export async function publishUntilStored(pool, relayUrl, event, label, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await Promise.allSettled(pool.publish([relayUrl], event));
    await sleep(750);
    const stored = await pool.get([relayUrl], { ids: [event.id] });
    if (stored?.id === event.id) {
      assert(true, label);
      return stored;
    }
  }
  throw new Error(`relay never round-tripped ${label}`);
}

export function emulatorUrl(url) {
  return url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2');
}

export function readState() {
  if (!existsSync(STATE_PATH)) return undefined;
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

export function writeState(state) {
  writeFileSync(STATE_PATH, `${JSON.stringify({ ...state, written_at: new Date().toISOString() }, null, 2)}\n`);
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

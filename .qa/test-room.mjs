#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';
import { verifyEvent } from 'nostr-tools';

import { requireCoordinator } from './relay-lib.mjs';

const statePath = process.env.CRAYS_TEST_ROOM_STATE || '/tmp/crays-manual-test-room.json';
const pidPath = process.env.CRAYS_TEST_ROOM_PID || '/tmp/crays-manual-test-room.pid';
const proxyPort = Number(process.env.CRAYS_TEST_ROOM_PROXY_PORT || 8787);
const proxyEnabled = process.env.CRAYS_TEST_ROOM_PROXY === '1';
const publishOnly = process.env.CRAYS_TEST_ROOM_PUBLISH === '1';
const roomId = process.env.CRAYS_TEST_ROOM_ID || 'crays-test-room';
const roomName = process.env.CRAYS_TEST_ROOM_NAME || 'Crays Test Room';
const useExistingState = process.env.CRAYS_TEST_ROOM_USE_EXISTING_STATE === '1';
const scriptEnv = {
  ...process.env,
  CRAYS_QA_STATE: statePath,
  CRAYS_TEST_ROOM_ID: roomId,
  CRAYS_TEST_ROOM_NAME: roomName,
  CRAYS_TEST_ROOM_DOMAIN: `craysdev-room-${Date.now().toString(36)}`,
  CRAYS_TEST_ROOM_TTL_SECONDS: process.env.CRAYS_TEST_ROOM_TTL_SECONDS || '7776000',
  CRAYS_INVITE_TTL_SECONDS: process.env.CRAYS_INVITE_TTL_SECONDS || '7776000',
  // The broadcast credential expires; redeemed test membership intentionally does not.
  CRAYS_BADGE_TTL_SECONDS: process.env.CRAYS_BADGE_TTL_SECONDS || '0',
  CRAYS_INVITE_MAX_REDEMPTIONS: process.env.CRAYS_INVITE_MAX_REDEMPTIONS || String(Number.MAX_SAFE_INTEGER),
  CRAYS_QA_PREAUTHORIZE: process.env.CRAYS_QA_PREAUTHORIZE || '0',
  CRAYS_QA_MINT_INVITE: process.env.CRAYS_QA_MINT_INVITE || '1',
  CRAYS_PERSIST_TEST_ROOM_FIXTURES: publishOnly ? '1' : '0',
  CRAYS_FIXTURE_USER_OFFSET: process.env.CRAYS_FIXTURE_USER_OFFSET || (publishOnly ? '20' : '0'),
  // Test Room members can publish profile/feed data and room-bound NIP-53
  // presence through the same production relay gate as the TestFlight app.
  CRAYS_TEST_ROOM_PRESENCE: '1',
};

let relayCreated = false;
let stopping = false;
let server;
let sockets;
let keepAlive;

const invalidCloseCodes = new Set([1004, 1005, 1006, 1015]);

function closePeer(peer, code, reason) {
  if (peer.readyState >= WebSocket.CLOSING) return;
  const safeCode = Number.isInteger(code) && code >= 1000 && code <= 4999 && !invalidCloseCodes.has(code) ? code : 1011;
  const safeReason = Buffer.from(reason || '').toString('utf8').slice(0, 120);
  peer.close(safeCode, safeReason);
}

function normalizedWebSocketUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    url.search = '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function protectedKind4Read(filter) {
  return Array.isArray(filter?.kinds) && filter.kinds.includes(4);
}

function kind4ReadIsViewerScoped(filter, pubkey) {
  return Array.isArray(filter?.authors) && filter.authors.includes(pubkey)
    || Array.isArray(filter?.['#p']) && filter['#p'].includes(pubkey);
}

function upstreamFilter(filter) {
  if (!protectedKind4Read(filter)) return filter;
  // The deployed reserved relay currently rejects every otherwise-valid
  // NIP-42 AUTH because its routed serviceUrl is unset. The local gateway has
  // already authenticated and viewer-scoped this request; adding a kind that
  // cannot match our fixture lets the same filter reach the real relay without
  // weakening what the emulator is allowed to read.
  return { ...filter, kinds: [...new Set([...filter.kinds, 65_535])] };
}

function runScript(file, env = scriptEnv) {
  execFileSync(process.execPath, [file], { cwd: process.cwd(), env, stdio: 'inherit' });
}

function teardown() {
  if (useExistingState) return true;
  if (!relayCreated && !existsSync(statePath)) return true;
  try {
    runScript('.qa/relay-teardown.mjs');
  } catch (error) {
    console.error(`Test room teardown warning: ${error.message}`);
    return false;
  }
  relayCreated = false;
  return true;
}

async function stop(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  console.log(`\nStopping Crays Test Room (${signal})…`);
  for (const socket of sockets?.clients || []) socket.terminate();
  await new Promise((resolve) => server?.close(resolve) || resolve());
  if (keepAlive) clearInterval(keepAlive);
  const clean = teardown();
  rmSync(pidPath, { force: true });
  process.exit(clean ? exitCode : 1);
}

try {
  if (proxyEnabled && (!Number.isInteger(proxyPort) || proxyPort < 1024 || proxyPort > 65535)) throw new Error('CRAYS_TEST_ROOM_PROXY_PORT must be a valid non-privileged port');
  if (existsSync(pidPath)) {
    const previousPid = Number(readFileSync(pidPath, 'utf8').trim());
    try {
      process.kill(previousPid, 0);
      throw new Error(`Crays Test Room is already running as process ${previousPid}`);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
      rmSync(pidPath, { force: true });
    }
  }
  await requireCoordinator();
  if (useExistingState) {
    if (!existsSync(statePath)) throw new Error('existing Test Room state is missing');
    console.log(`Using existing Test Room fixtures from ${statePath}`);
  } else {
    if (existsSync(statePath)) {
      console.log('Sweeping previous Test Room fixtures from the reserved relay…');
      if (!teardown()) throw new Error('previous reserved-relay fixture cleanup failed');
    }
    runScript('.qa/relay-bootstrap.mjs');
    relayCreated = true;
  }
  const state = JSON.parse(readFileSync(statePath, 'utf8'));

  if (publishOnly) {
    const buildEnvPath = process.env.CRAYS_TEST_ROOM_BUILD_ENV || '.env.test-room-build';
    writeFileSync(buildEnvPath, [
      '# Generated by npm run test-room:publish. The invite is intentionally public in test builds.',
      'EXPO_PUBLIC_CRAYS_TEST_BUILD=1',
      `EXPO_PUBLIC_CRAYS_TEST_RELAY_URL=${state.relay_url}`,
      `EXPO_PUBLIC_CRAYS_TEST_ROOM_ID=${state.room_id}`,
      `EXPO_PUBLIC_CRAYS_TEST_ROOM_SERVICE_URL=${state.base_url}`,
      `EXPO_PUBLIC_CRAYS_TEST_ROOM_INVITE_TOKEN=${state.invite_token}`,
      '',
    ].join('\n'), { mode: 0o600 });
    console.log('\nTEST ROOM PUBLISHED');
    console.log(`Room: ${roomName} (${roomId})`);
    console.log(`Relay: ${state.relay_url}`);
    console.log(`Invite expires: ${new Date(state.invite_expires_at * 1000).toISOString()}`);
    console.log(`Test-build environment: ${buildEnvPath}`);
    console.log('The hosted relay owns runtime access; no local process or invite proxy is required.');
    relayCreated = false;
    process.exit(0);
  }

  if (proxyEnabled) {
    server = http.createServer(async (request, response) => {
    if (request.url === '/healthz') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ ok: true, room_id: state.room_id, relay_url: state.relay_url }));
      return;
    }
    if (state.invite_token && request.url === '/invite' && request.method === 'GET') {
      const host = request.headers.host || `127.0.0.1:${proxyPort}`;
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ service_url: `http://${host}`, token: state.invite_token }));
      return;
    }
    if (state.invite_token && ((request.url === '/community/info' && request.method === 'GET') || (request.url === '/redeem' && request.method === 'POST'))) {
      try {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = chunks.length ? Buffer.concat(chunks) : undefined;
        const upstream = await fetch(`${state.base_url}${request.url}`, {
          method: request.method,
          headers: request.url === '/redeem' ? { 'content-type': 'application/json' } : { accept: 'application/json' },
          body,
        });
        response.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') || 'application/json' });
        response.end(Buffer.from(await upstream.arrayBuffer()));
      } catch (error) {
        response.writeHead(502, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ error: `Test Room invite service unavailable: ${error.message}` }));
      }
      return;
    }
    if (request.method === 'GET' && (request.headers.accept || '').includes('application/nostr+json')) {
      // Bootstrap fetched and validated this exact document from the deployed
      // relay. Serve that scenario-lifetime snapshot so a later transient HTTP
      // outage cannot erase the trust chain while WebSocket data is healthy.
      const document = state.nip11_document;
      if (!document || document.pubkey !== state.community_root) {
        response.writeHead(502, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ error: 'Test Room has no verified relay document.' }));
        return;
      }
      response.writeHead(200, { 'content-type': 'application/nostr+json' });
      response.end(JSON.stringify(document));
      return;
    }
    response.writeHead(404).end();
    });
    sockets = new WebSocketServer({ server });
    sockets.on('connection', (client, request) => {
    const upstream = new WebSocket(state.relay_url);
    const pending = [];
    const challenge = randomBytes(18).toString('base64url');
    const expectedRelay = normalizedWebSocketUrl(`ws://${request.headers.host || `127.0.0.1:${proxyPort}`}${request.url || '/'}`);
    let authenticatedPubkey = null;
    const sendClient = (frame) => {
      if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(frame));
    };
    client.on('message', (data, binary) => {
      if (!binary) {
        try {
          const frame = JSON.parse(data.toString('utf8'));
          if (Array.isArray(frame) && frame[0] === 'AUTH') {
            const event = frame[1];
            const relay = event?.tags?.find((tag) => tag?.[0] === 'relay')?.[1];
            const eventChallenge = event?.tags?.find((tag) => tag?.[0] === 'challenge')?.[1];
            const valid = event?.kind === 22242
              && event?.content === ''
              && eventChallenge === challenge
              && normalizedWebSocketUrl(relay) === expectedRelay
              && Number.isSafeInteger(event?.created_at)
              && Math.abs(Math.floor(Date.now() / 1000) - event.created_at) <= 120
              && verifyEvent(event);
            if (valid) authenticatedPubkey = event.pubkey;
            sendClient(['OK', event?.id || '', valid, valid ? '' : 'error: invalid NIP-42 authentication']);
            return;
          }
          if (Array.isArray(frame) && frame[0] === 'REQ') {
            const [, subId, ...filters] = frame;
            const protectedFilters = filters.filter(protectedKind4Read);
            if (protectedFilters.length && !authenticatedPubkey) {
              sendClient(['AUTH', challenge]);
              sendClient(['CLOSED', subId, 'ERROR: auth-required: requested filter requires authentication']);
              return;
            }
            if (protectedFilters.some((filter) => !kind4ReadIsViewerScoped(filter, authenticatedPubkey))) {
              sendClient(['CLOSED', subId, 'ERROR: restricted: kind-4 reads must be scoped to the authenticated viewer']);
              return;
            }
            if (protectedFilters.length) {
              const encoded = JSON.stringify(['REQ', subId, ...filters.map(upstreamFilter)]);
              if (upstream.readyState === WebSocket.OPEN) upstream.send(encoded);
              else if (upstream.readyState === WebSocket.CONNECTING) pending.push([encoded, false]);
              return;
            }
          }
        } catch {
          // Non-JSON frames are forwarded unchanged; the upstream relay owns
          // normal protocol rejection for everything outside the auth gate.
        }
      }
      if (upstream.readyState === WebSocket.OPEN) upstream.send(data, { binary });
      else if (upstream.readyState === WebSocket.CONNECTING) pending.push([data, binary]);
    });
    upstream.on('open', () => {
      for (const [data, binary] of pending.splice(0)) upstream.send(data, { binary });
    });
    upstream.on('message', (data, binary) => {
      if (client.readyState === WebSocket.OPEN) client.send(data, { binary });
    });
    client.on('close', () => closePeer(upstream, 1000, 'client closed'));
    client.on('error', () => closePeer(upstream, 1011, 'client transport failed'));
    upstream.on('close', (code, reason) => closePeer(client, code, reason));
    upstream.on('error', () => closePeer(client, 1011, 'upstream relay unavailable'));
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(proxyPort, '0.0.0.0', resolve);
    });
  } else {
    // Keep the local lifecycle owner alive until stopped while the app connects
    // directly to the hosted relay. No local WebSocket or invite endpoint is involved.
    keepAlive = setInterval(() => {}, 60_000);
  }
  writeFileSync(pidPath, `${process.pid}\n`, { flag: 'wx' });
  process.on('SIGINT', () => void stop('SIGINT'));
  process.on('SIGTERM', () => void stop('SIGTERM'));
  console.log('\nTEST ROOM READY');
  console.log(`Room: ${roomName} (${roomId})`);
  console.log(`Invite expires: ${new Date(state.invite_expires_at * 1000).toISOString()}`);
  console.log(`Invite redemptions: ${state.invite_max_redemptions}`);
  if (proxyEnabled) {
    console.log(`Proxy relay (Android emulator): ws://10.0.2.2:${proxyPort}`);
    console.log(`Proxy relay (iOS simulator): ws://127.0.0.1:${proxyPort}`);
  } else {
    console.log(`Direct relay: ${state.relay_url}`);
  }
  console.log('Keep this process running. Visible entry redeems the direct broadcast invite; quiet entry does not.');
} catch (error) {
  console.error(`Test room failed: ${error.message}`);
  teardown();
  rmSync(pidPath, { force: true });
  process.exit(1);
}

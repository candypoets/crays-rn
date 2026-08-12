#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';

import { requireCoordinator } from './relay-lib.mjs';

const statePath = process.env.CRAYS_TEST_ROOM_STATE || '/tmp/crays-manual-test-room.json';
const pidPath = process.env.CRAYS_TEST_ROOM_PID || '/tmp/crays-manual-test-room.pid';
const proxyPort = Number(process.env.CRAYS_TEST_ROOM_PROXY_PORT || 8787);
const proxyEnabled = process.env.CRAYS_TEST_ROOM_PROXY === '1';
const roomId = process.env.CRAYS_TEST_ROOM_ID || 'crays-test-room';
const roomName = process.env.CRAYS_TEST_ROOM_NAME || 'Crays Test Room';
const scriptEnv = {
  ...process.env,
  CRAYS_QA_STATE: statePath,
  CRAYS_TEST_ROOM_ID: roomId,
  CRAYS_TEST_ROOM_NAME: roomName,
  CRAYS_TEST_ROOM_DOMAIN: `craysdev-room-${Date.now().toString(36)}`,
  CRAYS_TEST_ROOM_TTL_SECONDS: process.env.CRAYS_TEST_ROOM_TTL_SECONDS || '86400',
  CRAYS_INVITE_TTL_SECONDS: process.env.CRAYS_INVITE_TTL_SECONDS || '86400',
  CRAYS_BADGE_TTL_SECONDS: process.env.CRAYS_BADGE_TTL_SECONDS || '86400',
  CRAYS_INVITE_MAX_REDEMPTIONS: process.env.CRAYS_INVITE_MAX_REDEMPTIONS || '100',
  CRAYS_QA_PREAUTHORIZE: process.env.CRAYS_QA_PREAUTHORIZE || '0',
  CRAYS_QA_MINT_INVITE: process.env.CRAYS_QA_MINT_INVITE || '0',
};

let relayCreated = false;
let stopping = false;
let server;
let sockets;
let keepAlive;

function runScript(file, env = scriptEnv) {
  execFileSync(process.execPath, [file], { cwd: process.cwd(), env, stdio: 'inherit' });
}

function teardown() {
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
  if (existsSync(statePath)) {
    console.log('Sweeping previous Test Room fixtures from the reserved relay…');
    if (!teardown()) throw new Error('previous reserved-relay fixture cleanup failed');
  }
  runScript('.qa/relay-bootstrap.mjs');
  relayCreated = true;
  const state = JSON.parse(readFileSync(statePath, 'utf8'));

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
        // NIP-11 passthrough for the explicit local-proxy mode.
        try {
          const upstreamHttp = state.relay_url.replace(/^ws/, 'http');
          const upstream = await fetch(`${upstreamHttp}${request.url}`, { headers: { accept: 'application/nostr+json' } });
          response.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') || 'application/nostr+json' });
          response.end(Buffer.from(await upstream.arrayBuffer()));
        } catch (error) {
          response.writeHead(502, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ error: `Test Room relay document unavailable: ${error.message}` }));
        }
        return;
      }
      response.writeHead(404).end();
    });
    sockets = new WebSocketServer({ server });
    sockets.on('connection', (client) => {
      const upstream = new WebSocket(state.relay_url);
      const pending = [];
      client.on('message', (data, binary) => {
        if (upstream.readyState === WebSocket.OPEN) upstream.send(data, { binary });
        else if (upstream.readyState === WebSocket.CONNECTING) pending.push([data, binary]);
      });
      upstream.on('open', () => {
        for (const [data, binary] of pending.splice(0)) upstream.send(data, { binary });
      });
      upstream.on('message', (data, binary) => {
        if (client.readyState === WebSocket.OPEN) client.send(data, { binary });
      });
      client.on('close', () => upstream.close());
      client.on('error', () => upstream.close());
      upstream.on('close', (code, reason) => client.readyState < WebSocket.CLOSING && client.close(code || 1011, reason));
      upstream.on('error', () => client.readyState < WebSocket.CLOSING && client.close(1011, 'upstream relay unavailable'));
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(proxyPort, '0.0.0.0', resolve);
    });
  } else {
    // Keep the fixture alive until stopped while the app connects directly to
    // the hosted relay. No local WebSocket or invite endpoint is involved.
    keepAlive = setInterval(() => {}, 60_000);
  }
  writeFileSync(pidPath, `${process.pid}\n`, { flag: 'wx' });
  process.on('SIGINT', () => void stop('SIGINT'));
  process.on('SIGTERM', () => void stop('SIGTERM'));
  console.log('\nTEST ROOM READY');
  console.log(`Room: ${roomName} (${roomId})`);
  if (proxyEnabled) {
    console.log(`Proxy relay (Android emulator): ws://10.0.2.2:${proxyPort}`);
    console.log(`Proxy relay (iOS simulator): ws://127.0.0.1:${proxyPort}`);
  } else {
    console.log(`Direct relay: ${state.relay_url}`);
  }
  console.log('Keep this process running. A normal developer identity should enter quietly.');
} catch (error) {
  console.error(`Test room failed: ${error.message}`);
  teardown();
  rmSync(pidPath, { force: true });
  process.exit(1);
}

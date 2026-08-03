#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';

import { requireCoordinator } from './relay-lib.mjs';

const statePath = process.env.CRAYS_TEST_ROOM_STATE || '/tmp/crays-manual-test-room.json';
const pidPath = process.env.CRAYS_TEST_ROOM_PID || '/tmp/crays-manual-test-room.pid';
const proxyPort = Number(process.env.CRAYS_TEST_ROOM_PROXY_PORT || 8787);
const roomId = process.env.CRAYS_TEST_ROOM_ID || 'crays-test-room';
const roomName = process.env.CRAYS_TEST_ROOM_NAME || 'Crays Test Room';
const scriptEnv = {
  ...process.env,
  CRAYS_QA_STATE: statePath,
  CRAYS_TEST_ROOM_ID: roomId,
  CRAYS_TEST_ROOM_NAME: roomName,
  CRAYS_TEST_ROOM_DOMAIN: `craysdev-room-${Date.now().toString(36)}`,
  CRAYS_TEST_ROOM_TTL_SECONDS: process.env.CRAYS_TEST_ROOM_TTL_SECONDS || '86400',
};

let relayCreated = false;
let stopping = false;
let server;
let sockets;

function runScript(file, env = scriptEnv) {
  execFileSync(process.execPath, [file], { cwd: process.cwd(), env, stdio: 'inherit' });
}

function teardown() {
  if (!relayCreated && !existsSync(statePath)) return;
  try {
    runScript('.qa/relay-teardown.mjs');
  } catch (error) {
    console.error(`Test room teardown warning: ${error.message}`);
  }
  relayCreated = false;
}

async function stop(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  console.log(`\nStopping Crays Test Room (${signal})…`);
  for (const socket of sockets?.clients || []) socket.terminate();
  await new Promise((resolve) => server?.close(resolve) || resolve());
  teardown();
  rmSync(pidPath, { force: true });
  process.exit(exitCode);
}

try {
  if (!Number.isInteger(proxyPort) || proxyPort < 1024 || proxyPort > 65535) throw new Error('CRAYS_TEST_ROOM_PROXY_PORT must be a valid non-privileged port');
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
    console.log('Removing the previous scoped Test Room relay…');
    teardown();
  }
  runScript('.qa/relay-bootstrap.mjs');
  relayCreated = true;
  const state = JSON.parse(readFileSync(statePath, 'utf8'));

  server = http.createServer((request, response) => {
    if (request.url === '/healthz') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ ok: true, room_id: state.room_id, relay_url: state.relay_url }));
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
  writeFileSync(pidPath, `${process.pid}\n`, { flag: 'wx' });
  process.on('SIGINT', () => void stop('SIGINT'));
  process.on('SIGTERM', () => void stop('SIGTERM'));
  console.log('\nTEST ROOM READY');
  console.log(`Room: ${roomName} (${roomId})`);
  console.log(`Android emulator relay: ws://10.0.2.2:${proxyPort}`);
  console.log(`iOS simulator relay: ws://127.0.0.1:${proxyPort}`);
  console.log('Keep this process running. A normal developer identity should enter quietly.');
} catch (error) {
  console.error(`Test room failed: ${error.message}`);
  teardown();
  rmSync(pidPath, { force: true });
  process.exit(1);
}

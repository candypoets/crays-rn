#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
import { verifyEvent } from 'nostr-tools';

const port = Number(process.env.CRAYS_BLOSSOM_PORT || 8791);
const statePath = process.env.CRAYS_BLOSSOM_STATE;
if (!statePath) throw new Error('CRAYS_BLOSSOM_STATE is required');
const blobs = new Map();
let uploadState = null;

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function authorizationEvent(request) {
  const header = String(request.headers.authorization || '');
  if (!header.startsWith('Nostr ')) throw new Error('missing Nostr authorization');
  const event = JSON.parse(Buffer.from(header.slice(6), 'base64url').toString('utf8'));
  if (!verifyEvent(event) || event.kind !== 24242) throw new Error('invalid signed Blossom authorization');
  return event;
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'GET' && request.url === '/healthz') return json(response, 200, { ok: true });
    if (request.method === 'PUT' && request.url === '/upload') {
      const event = authorizationEvent(request);
      const body = await readBody(request);
      const sha256 = createHash('sha256').update(body).digest('hex');
      const declared = String(request.headers['x-sha-256'] || '');
      if (declared !== sha256) return json(response, 400, { error: 'hash mismatch' });
      if (!event.tags.some((tag) => tag[0] === 't' && tag[1] === 'upload')) return json(response, 401, { error: 'missing upload verb' });
      if (!event.tags.some((tag) => tag[0] === 'x' && tag[1] === sha256)) return json(response, 401, { error: 'authorization hash mismatch' });
      blobs.set(sha256, { body, type: String(request.headers['content-type'] || 'application/octet-stream') });
      uploadState = { authorizationEvent: event, contentType: String(request.headers['content-type'] || ''), downloadCount: 0, sha256, size: body.length, uploadedAt: Date.now() };
      writeFileSync(statePath, JSON.stringify(uploadState, null, 2));
      return json(response, 200, { sha256, size: body.length, type: uploadState.contentType, url: `http://10.0.2.2:${port}/${sha256}` });
    }
    if (request.method === 'GET' && request.url?.startsWith('/')) {
      const blob = blobs.get(request.url.slice(1).split('.')[0]);
      if (!blob) return json(response, 404, { error: 'missing blob' });
      if (uploadState) {
        uploadState.downloadCount += 1;
        writeFileSync(statePath, JSON.stringify(uploadState, null, 2));
      }
      response.writeHead(200, { 'content-type': blob.type, 'content-length': String(blob.body.length) });
      return response.end(blob.body);
    }
    return json(response, 404, { error: 'not found' });
  } catch (cause) {
    return json(response, 401, { error: cause instanceof Error ? cause.message : String(cause) });
  }
});

server.listen(port, '0.0.0.0', () => console.log(`QA Blossom adapter listening on ${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));

#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { verifyEvent } from 'nostr-tools';
import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';

const blossomPath = process.env.CRAYS_BLOSSOM_STATE;
if (!blossomPath) throw new Error('CRAYS_BLOSSOM_STATE is required');
const upload = JSON.parse(readFileSync(blossomPath, 'utf8'));
const state = readState();
assert(/^[0-9a-f]{64}$/.test(upload.sha256), 'Blossom adapter received and hashed one binary image');
assert(upload.size > 0, 'Blossom adapter received a non-empty image');
assert(String(upload.contentType).startsWith('image/'), 'Blossom upload carries an image MIME type');
assert(upload.downloadCount > 0, 'room feed fetched the uploaded Blossom image');
assert(verifyEvent(upload.authorizationEvent), 'Blossom authorization has a valid app identity signature');
assert(upload.authorizationEvent.kind === 24242, 'Blossom authorization uses kind 24242');
assert(upload.authorizationEvent.tags.some((tag) => tag[0] === 'x' && tag[1] === upload.sha256), 'Blossom authorization is scoped to the uploaded hash');

const pool = makePool();
const { result: note } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [1], authors: [state.qa_pubkey], '#h': [state.room_id], limit: 50 },
  (events) => events.find((event) => event.tags.some((tag) => tag[0] === 'imeta' && tag.some((value) => value === `x ${upload.sha256}`))),
  'image post references the independently received Blossom blob',
);
pool.close([state.relay_url]);
assert(verifyEvent(note), 'image post has a valid app identity signature');
assert(note.content.includes(`http://10.0.2.2:8791/${upload.sha256}`), 'image post content includes the Blossom descriptor URL');
assert(note.tags.some((tag) => tag[0] === 'expiration'), 'image post expires with the room session');
console.log('CRAYS BLOSSOM UPLOAD VERIFY PASS');

#!/usr/bin/env node
import { nip04, verifyEvent } from 'nostr-tools';
import { MESSAGE_REQUEST_TEXT, ROOM_DISPLAY_NAME } from './flow-fixtures.mjs';
import { assert, loadKeys, makePool, nowSeconds, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
const keys = loadKeys();
const recipientPubkey = state.fixture_pubkeys?.[1];
const recipient = keys.users.find((user) => user.pub === recipientPubkey);
if (!recipient) throw new Error('scenario state does not identify a fixture recipient key');
const pool = makePool();
const { events } = await queryUntil(
  pool, state.relay_url,
  { kinds: [4], authors: [state.qa_pubkey], '#p': [recipient.pub], limit: 30 },
  (polled) => polled.length >= 1,
  'recipient kind-4 direct message is stored',
);
pool.close([state.relay_url]);

assert(events.length === 1, 'exactly one recipient kind-4 direct message is stored');
const event = events[0];
assert(verifyEvent(event), 'direct message has a valid app-identity signature');
assert(event.pubkey === state.qa_pubkey, 'relay-visible sender is the app identity required by NIP-04');
assert(event.created_at <= nowSeconds() && event.created_at >= nowSeconds() - 120, 'direct-message timestamp is current');
assert(event.tags.length === 1 && event.tags[0][0] === 'p' && event.tags[0][1] === recipient.pub, 'kind-4 metadata contains only the required recipient tag');
assert(event.content.includes('?iv=') && !event.content.includes(MESSAGE_REQUEST_TEXT), 'relay stores NIP-04 ciphertext, never submitted plaintext');
const plaintext = nip04.decrypt(recipient.priv, event.pubkey, event.content);
const envelope = JSON.parse(plaintext);
assert(envelope.schema === 'life.crays/dm/v1', 'recipient decrypts the versioned Crays direct-message envelope');
assert(envelope.messageType === 'message-request', 'encrypted envelope retains consent-aware request type');
assert(envelope.text === MESSAGE_REQUEST_TEXT, 'recipient decrypts the exact submitted plaintext');
assert(envelope.roomId === state.room_id && envelope.roomName === (state.room_name || ROOM_DISPLAY_NAME), 'encrypted envelope retains exact room context');
assert(typeof envelope.messageId === 'string' && envelope.messageId.length > 10, 'encrypted request has a stable message id');
console.log('CRAYS NIP-04 MESSAGE REQUEST VERIFY PASS');

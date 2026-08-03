#!/usr/bin/env node
import { nip04, verifyEvent } from 'nostr-tools';
import { assert, loadKeys, makePool, nowSeconds, readState } from './relay-lib.mjs';

const state = readState();
const keys = loadKeys();
const recipient = keys.users[1];
const pool = makePool();
const events = await pool.querySync([state.relay_url], { kinds: [4], authors: [state.qa_pubkey], '#p': [recipient.pub], limit: 30 });
const legacy = await pool.querySync([state.relay_url], { kinds: [78], authors: [state.qa_pubkey], '#p': [recipient.pub], limit: 30 });
pool.close([state.relay_url]);

assert(events.length === 2, 'acceptance and reply each produce exactly one kind-4 direct message');
const envelopes = events.map((event) => {
  assert(verifyEvent(event) && event.pubkey === state.qa_pubkey, `kind-4 event ${event.id.slice(0, 8)} is signed by the app identity`);
  assert(event.created_at <= nowSeconds() && event.created_at >= nowSeconds() - 120, 'direct-message timestamp is current');
  assert(event.tags.length === 1 && event.tags[0][0] === 'p' && event.tags[0][1] === recipient.pub, 'relay metadata contains only the intended recipient');
  assert(event.content.includes('?iv=') && !event.content.includes('Conversation accepted') && !event.content.includes('Yes — see you there.'), 'relay stores ciphertext instead of action plaintext');
  const envelope = JSON.parse(nip04.decrypt(recipient.priv, event.pubkey, event.content));
  assert(envelope.schema === 'life.crays/dm/v1', 'recipient decrypts the versioned Crays envelope');
  assert(envelope.roomId === state.room_id, 'encrypted envelope retains room context');
  return envelope;
});

const acceptance = envelopes.find((envelope) => envelope.messageType === 'message-acceptance');
const reply = envelopes.find((envelope) => envelope.messageType === 'message');
assert(Boolean(acceptance), 'recipient decrypts one conversation acceptance');
assert(acceptance.text === 'Conversation accepted', 'acceptance has the exact protocol receipt text');
assert(acceptance.replyTo === state.incoming_message_id, 'acceptance references the incoming request inside ciphertext');
assert(Boolean(reply), 'recipient decrypts one accepted reply');
assert(reply.text === 'Yes — see you there.', 'recipient decrypts the exact reply plaintext');
assert(reply.replyTo === acceptance.messageId, 'reply references the acceptance inside ciphertext');
assert(legacy.length === 0, 'acceptance and reply publish no kind-78 messages');
console.log('CRAYS NIP-04 CONVERSATION ACTIONS VERIFY PASS');

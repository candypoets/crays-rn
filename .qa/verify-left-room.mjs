#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools'; import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';
const state = readState(); const pool = makePool();
const { result: left } = await queryUntil(
  pool, state.relay_url,
  { kinds: [78], authors: [state.qa_pubkey], '#h': [state.room_id], limit: 20 },
  (events) => events.find((event) => event.tags.some((tag) => tag[0] === 'status' && tag[1] === 'left') && event.tags.some((tag) => tag[0] === 'd' && tag[1].endsWith(`/${state.qa_pubkey}`))),
  'visible account published the explicit left replacement event',
);
pool.close([state.relay_url]);
assert(Boolean(left), 'visible account published the explicit left replacement event'); assert(verifyEvent(left), 'left event has a valid app signer signature'); console.log('CRAYS LEAVE VERIFY PASS');

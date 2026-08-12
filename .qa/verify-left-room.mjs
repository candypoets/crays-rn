#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools'; import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';
const state = readState(); const pool = makePool();
const { result: left } = await queryUntil(
  pool, state.relay_url,
  { kinds: [10312], authors: [state.qa_pubkey], '#a': [state.room_address], limit: 20 },
  (events) => events.find((event) => event.tags.some((tag) => tag[0] === 'status' && tag[1] === 'left')),
  'visible account published the explicit NIP-53 left replacement event',
);
pool.close([state.relay_url]);
assert(Boolean(left), 'visible account published the explicit NIP-53 left replacement event');
assert(verifyEvent(left), 'left event has a valid app signer signature');
const roomTag = left.tags.find((tag) => tag[0] === 'a');
assert(roomTag?.[1] === state.room_address && roomTag?.[2] === state.relay_url && roomTag?.[3] === 'root', 'left replacement retains the exact NIP-53 room link');
assert(Number(left.tags.find((tag) => tag[0] === 'expiration')?.[1]) > 0, 'left replacement retains a bounded expiry');
console.log('CRAYS LEAVE VERIFY PASS');

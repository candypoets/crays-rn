#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools'; import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';
const state = readState(); const pool = makePool(); const communityAddress = `31727:${state.community_root}:community`;
const { result: left } = await queryUntil(
  pool, state.relay_url,
  { kinds: [10312], authors: [state.qa_pubkey], '#a': [communityAddress], limit: 20 },
  (events) => events.find((event) => event.tags.some((tag) => tag[0] === 'status' && tag[1] === 'left')),
  'visible account published the explicit NIP-53 left replacement event',
);
pool.close([state.relay_url]);
assert(Boolean(left), 'visible account published the explicit NIP-53 left replacement event');
assert(verifyEvent(left), 'left event has a valid app signer signature');
const anchorTag = left.tags.find((tag) => tag[0] === 'a');
assert(anchorTag?.[1] === communityAddress && anchorTag?.[2] === state.relay_url && anchorTag?.[3] === 'root', 'left replacement retains the exact community-anchor link');
assert(Number(left.tags.find((tag) => tag[0] === 'expiration')?.[1]) > 0, 'left replacement retains a bounded expiry');
console.log('CRAYS LEAVE VERIFY PASS');

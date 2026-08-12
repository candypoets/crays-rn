#!/usr/bin/env node
import { verifyEvent } from 'nostr-tools';
import { JOIN_VISIBLE_CONTEXT, JOIN_VISIBLE_INTENT, TEST_ROOM_QA_PROFILE_NAME } from './flow-fixtures.mjs';
import { assert, makePool, nowSeconds, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
const pool = makePool();
const communityAddress = `31727:${state.community_root}:community`;
const { events } = await queryUntil(
  pool, state.relay_url,
  { kinds: [10312], authors: [state.qa_pubkey], '#a': [communityAddress], limit: 20 },
  (polled) => polled.length >= 1,
  'visible entry publishes app-authored NIP-53 room presence',
);
assert(events.length === 1, 'replaceable NIP-53 presence leaves exactly one current app-authored event');
const event = events[0];
const tag = (name) => event.tags.find((candidate) => candidate[0] === name)?.[1];
const anchorTag = event.tags.find((candidate) => candidate[0] === 'a');
assert(verifyEvent(event), 'NIP-53 visible presence has a valid app identity signature');
assert(
  anchorTag?.[1] === communityAddress && anchorTag?.[2] === state.relay_url && anchorTag?.[3] === 'root',
  'presence links the exact NIP-97 community anchor with its authoritative relay hint',
);
assert(!event.tags.some((candidate) => ['d', 'h', 'schema', 'type', 'visibility'].includes(candidate[0])), 'presence carries no deprecated custom namespace tags');
assert(tag('intent') === JOIN_VISIBLE_INTENT, 'presence carries the selected intent');
assert(tag('context') === JOIN_VISIBLE_CONTEXT, 'presence carries the exact optional context');
const remaining = Number(tag('expiration')) - nowSeconds();
assert(remaining >= 3_540 && remaining <= 3_600, 'presence expiry matches the selected one-hour automatic leave window');

const { events: profiles } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [0], authors: [state.qa_pubkey], limit: 10 },
  (polled) => polled.length === 1 ? polled : null,
  'visible entry publishes the app-authored NIP-01 profile',
);
pool.close([state.relay_url]);
assert(profiles.length === 1, 'visible entry publishes exactly one app-authored profile');
const profile = profiles[0];
assert(verifyEvent(profile), 'visible profile has a valid app identity signature');
let profileContent;
try {
  profileContent = JSON.parse(profile.content);
} catch {
  throw new Error('ASSERT FAILED: visible profile content is valid JSON');
}
assert(
  profileContent.name === TEST_ROOM_QA_PROFILE_NAME && profileContent.display_name === TEST_ROOM_QA_PROFILE_NAME,
  'visible profile carries the exact Test Room QA display name',
);
console.log('CRAYS VISIBLE ENTRY NIP-53 VERIFY PASS');

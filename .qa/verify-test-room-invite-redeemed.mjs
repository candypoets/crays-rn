#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { verifyEvent } from 'nostr-tools';

import { assert, makePool, nowSeconds, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (
  !state?.invite_token ||
  !state.qa_pubkey ||
  !state.badge_issuer_pubkey ||
  !state.community_root ||
  !state.test_room_membership_definition_id
) {
  throw new Error('Test Room invite state is incomplete');
}
const claims = JSON.parse(Buffer.from(state.invite_token.split('.')[0], 'base64url').toString('utf8'));
const ninetyDays = 90 * 24 * 60 * 60;
assert(claims.max === Number.MAX_SAFE_INTEGER, 'Test Room invite allows effectively unlimited safe-integer redemptions');
assert(claims.exp === state.invite_expires_at, 'Test Room state records the signed invite expiry');
assert(state.invite_ttl_seconds === ninetyDays, 'Test Room requested an exact 90-day invite lifetime');
assert(claims.exp - nowSeconds() > 89 * 24 * 60 * 60, 'fresh Test Room invite has more than 89 days remaining');
assert(claims.badge_exp === undefined, 'redeemed Test Room membership has no expiry');

const pool = makePool();
const { result: membershipDefinition } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [30009], authors: [state.community_root], '#d': ['members'], limit: 10 },
  (events) => events.find((event) => event.id === state.test_room_membership_definition_id),
  'Test Room exposes its NIP-53-capable membership definition',
);
assert(verifyEvent(membershipDefinition), 'Test Room membership definition has a valid root signature');
const permissions = membershipDefinition.tags
  .filter((tag) => tag[0] === 'permission')
  .map((tag) => tag.slice(1))
  .sort((left, right) => left[0].localeCompare(right[0]));
assert(
  JSON.stringify(permissions) === JSON.stringify([['0', 'write'], ['1', 'write'], ['10312', 'write']]),
  'Test Room membership grants exactly profile, feed, and NIP-53 presence writes',
);
const { result: award } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [8], authors: [state.badge_issuer_pubkey], '#a': [claims.badge], '#p': [state.qa_pubkey], limit: 100 },
  (events) => events.find((event) => event.tags.some((tag) => tag[0] === 'i' && tag[1] === `invite-redemption:${claims.nonce}`)),
  'Test Room redemption issued the exact invite award',
);
pool.close([state.relay_url]);

const hasTag = (name, value) => award.tags.some((tag) => tag[0] === name && tag[1] === value);
assert(verifyEvent(award), 'Test Room invite award has a valid signature');
assert(award.pubkey === state.badge_issuer_pubkey, 'Test Room award is signed by the root-delegated badge issuer');
assert(hasTag('a', claims.badge), 'Test Room award grants the invited membership');
assert(hasTag('p', state.qa_pubkey), 'Test Room award belongs to the app identity');
assert(hasTag('t', 'membership'), 'Test Room award is explicitly a membership');
assert(!award.tags.some((tag) => tag[0] === 'expiration'), 'Test Room membership award is intentionally non-expiring');

const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const marker = '[crays-room-access-granted]';
const line = logcat.split('\n').findLast((entry) => entry.includes(marker) && entry.includes(`"roomId":"${state.room_id}"`));
if (!line) throw new Error('app never logged confirmed Test Room access');
let payload = line.slice(line.indexOf(marker) + marker.length).trim();
if (payload.startsWith("'")) payload = payload.slice(1);
if (payload.endsWith("'")) payload = payload.slice(0, -1);
const confirmed = JSON.parse(payload);
assert(confirmed.eventId === award.id, 'app confirmed the exact relay award returned by redemption before entry');
console.log('CRAYS TEST ROOM INVITE REDEMPTION VERIFY PASS');

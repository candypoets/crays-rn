#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { verifyEvent } from 'nostr-tools';
import {
  FIXTURE_EVENT_TITLE,
  FIXTURE_MEMBERSHIP_NAME,
  FIXTURE_PEOPLE,
  FIXTURE_PRODUCTS,
} from './flow-fixtures.mjs';
import { assert, makePool, queryUntil, readState } from './relay-lib.mjs';

const state = readState();
if (!state?.room_id) throw new Error('missing scenario state');

// Independent relay truth: the fixture family the app claims to have
// projected must exist on the scenario relay with the seeded content.
const fixtureIds = [
  ...(state.profile_ids || []),
  ...(state.presence_ids || []),
  ...(state.feed_ids || []),
  ...(state.definition_ids || []),
  state.event_id,
].filter(Boolean);
const pool = makePool();
const { events } = await queryUntil(
  pool,
  state.relay_url,
  { kinds: [0, 1, 10312, 30009, 30402, 31923], limit: 200 },
  (polled) => fixtureIds.every((id) => polled.some((event) => event.id === id)),
  'projected fixture family is stored on the scenario relay',
);
pool.close([state.relay_url]);
assert(events.every(verifyEvent), 'every projected fixture has a valid Nostr signature');

const profiles = events.filter((event) => event.kind === 0 && state.profile_ids.includes(event.id));
for (const [name, about] of FIXTURE_PEOPLE) {
  const profile = profiles.find((event) => {
    try { return JSON.parse(event.content).name === name; } catch { return false; }
  });
  assert(Boolean(profile), `seeded profile ${name} exists on the relay`);
  assert(JSON.parse(profile.content).about === about, `${name} profile carries the seeded bio`);
}

const presence = events.filter((event) => event.kind === 10312 && state.presence_ids.includes(event.id));
assert(presence.length === FIXTURE_PEOPLE.length, 'all seeded visible presence fixtures exist on the relay');
assert(
  presence.every((event) => event.tags.some((tag) => tag[0] === 'a' && tag[1] === state.room_address && tag[2] === state.relay_url && tag[3] === 'root')),
  'seeded NIP-53 presence fixtures are bound to the exact kind-30312 room definition',
);

assert(state.feed_ids.every((id) => events.some((event) => event.id === id && event.kind === 1)), 'all seeded room feed posts exist on the relay');

const definitions = events.filter((event) => event.kind === 30009 || event.kind === 30402);
// NIP-97: 30402 listings name with `title`; 30009 memberships keep `name`.
const definitionName = (event) => event.tags.find((tag) => tag[0] === 'title' || tag[0] === 'name')?.[1];
for (const [, productName, , price] of FIXTURE_PRODUCTS) {
  const product = definitions.find((event) => definitionName(event) === productName);
  assert(Boolean(product), `seeded product ${productName} exists on the relay`);
  assert(product.tags.some((tag) => tag[0] === 'price' && tag[1] === price), `${productName} carries the seeded price`);
  assert(product.tags.some((tag) => tag[0] === 'availability' && tag[1] === 'available'), `${productName} is available`);
}
assert(definitions.some((event) => definitionName(event) === FIXTURE_MEMBERSHIP_NAME), 'seeded membership definition exists on the relay');

const calendarEvent = events.find((event) => event.id === state.event_id);
assert(calendarEvent?.kind === 31923, 'seeded calendar event exists on the relay');
assert(calendarEvent.tags.some((tag) => tag[0] === 'title' && tag[1] === FIXTURE_EVENT_TITLE), 'calendar event carries the seeded title');

// Complementary app-side check: the app projected each relay-backed fixture
// family into its room model.
const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const payloads = logcat
  .split('\n')
  .filter((line) => line.includes('[crays-room-data]'))
  .map((line) => {
    let payload = line.slice(line.indexOf('[crays-room-data]') + '[crays-room-data]'.length).trim();
    if (payload.startsWith("'")) payload = payload.slice(1);
    if (payload.endsWith("'")) payload = payload.slice(0, -1);
    try { return JSON.parse(payload); } catch { return null; }
  })
  .filter(Boolean);
const types = new Set(payloads.map((value) => value.type));
assert(types.has('profile'), 'app projected relay-backed room profiles');
assert(types.has('presence'), 'app projected relay-backed visible presence');
assert(types.has('post'), 'app projected relay-backed room feed events');
assert(types.has('product'), 'app projected relay-backed menu definitions');
assert(types.has('membership'), 'app projected relay-backed membership definition');
assert(types.has('event'), 'app projected relay-backed calendar event');
console.log('CRAYS ROOM CONSUMPTION PASS');

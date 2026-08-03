#!/usr/bin/env node
import { nip04 } from 'nostr-tools';
import {
  FIXTURE_EVENT_TITLE,
  FIXTURE_MEMBERSHIP_NAME,
  FIXTURE_PEOPLE,
  FIXTURE_PRODUCTS,
  ROOM_ABOUT,
  ROOM_DISPLAY_NAME,
} from './flow-fixtures.mjs';
import {
  assert,
  createRelay,
  emulatorUrl,
  getRelaySecrets,
  loadKeys,
  makePool,
  nip98Header,
  nowSeconds,
  publishUntilStored,
  requireCoordinator,
  signEvent,
  sleep,
  waitRelayRunning,
  writeState,
} from './relay-lib.mjs';

const keys = loadKeys();
const run = Date.now().toString(36);
const roomDisplayName = process.env.CRAYS_TEST_ROOM_NAME || ROOM_DISPLAY_NAME;
const name = process.env.CRAYS_TEST_ROOM_NAME ? `${roomDisplayName} ${run}` : `Crays QA Skyline ${run}`;
const roomId = process.env.CRAYS_TEST_ROOM_ID || `skyline-${run}`;
const domainLabel = process.env.CRAYS_TEST_ROOM_DOMAIN || `craysqa-room-${run}`;
const fixtureTtlSeconds = Math.min(604_800, Math.max(3_600, Number(process.env.CRAYS_TEST_ROOM_TTL_SECONDS || 86_400)));
if (!Number.isFinite(fixtureTtlSeconds)) throw new Error('CRAYS_TEST_ROOM_TTL_SECONDS must be a number');

await requireCoordinator();
const created = await createRelay(
  {
    name,
    description: 'Crays RN relay-backed screen fixtures; safe to delete.',
    domain_label: domainLabel,
    admin_pubkeys: [keys.admin.pub],
    badge_d: 'members',
  },
  keys,
);
const relay = await waitRelayRunning(created.id, keys);
assert(relay.relay_url.startsWith('ws'), `room relay running at ${relay.relay_url}`);
writeState({
  run,
  id: created.id,
  name,
  room_id: roomId,
  room_name: roomDisplayName,
  domain: relay.domain,
  relay_url: relay.relay_url,
  emulator_relay_url: emulatorUrl(relay.relay_url),
  base_url: relay.base_url,
  emulator_base_url: emulatorUrl(relay.base_url),
  operator_pubkey: keys.admin.pub,
  required_badge: relay.required_badge,
  phase: 'provisioned',
});

const pool = makePool();

const inviteEndpoint = `${relay.base_url}/invites`;
const inviteBody = JSON.stringify({
  expires_in_seconds: Number(process.env.CRAYS_INVITE_TTL_SECONDS || 3600),
  badge_expires_in_seconds: Number(process.env.CRAYS_BADGE_TTL_SECONDS || 604800),
  max_redemptions: Number(process.env.CRAYS_INVITE_MAX_REDEMPTIONS || 5),
});
let invite;
for (let attempt = 0; attempt < 30 && !invite; attempt += 1) {
  try {
    const inviteResponse = await fetch(inviteEndpoint, {
      method: 'POST',
      headers: {
        authorization: nip98Header(inviteEndpoint, 'POST', inviteBody, keys.admin.priv),
        'content-type': 'application/json',
      },
      body: inviteBody,
    });
    if (inviteResponse.ok) invite = await inviteResponse.json();
  } catch {
    // Coordinator status can turn running just before the invite port accepts.
  }
  if (!invite) await sleep(750);
}
if (!invite) throw new Error('invite service did not mint a token before timeout');
assert(typeof invite.token === 'string' && invite.token.includes('.'), 'real invite service minted a signed token');
const publish = (event, label) => publishUntilStored(pool, relay.relay_url, event, label);
const profile = signEvent(
  { kind: 0, content: JSON.stringify({ name: roomDisplayName, about: 'Rooftop jazz, drinks and late-night company.' }) },
  keys.admin.priv,
);
await publish(profile, 'venue kind-0 round-trips after the write gate is ready');

// Authorize deterministic people so their own signed profile/feed/presence
// fixtures pass the exact membership gate the app will encounter.
const secrets = await getRelaySecrets(created.id, keys);
const issuerSecret = secrets.badge_issuer_secret_key;
if (!/^[0-9a-f]{64}$/i.test(issuerSecret || '')) throw new Error('relay did not expose a badge issuer secret');
const requiredBadge = relay.required_badge;
if (!/^30009:[0-9a-f]{64}:members$/i.test(requiredBadge || '')) {
  throw new Error('relay did not expose its required membership badge address');
}
const fixtureUsers = keys.users.slice(0, 3);
const qaUserIndex = Number(process.env.CRAYS_QA_USER_INDEX || 0);
const qaUser = keys.users[qaUserIndex];
if (!qaUser) throw new Error(`CRAYS_QA_USER_INDEX ${qaUserIndex} has no fixture key`);
const authorizedUsers = [...new Map([
  ...fixtureUsers,
  ...(process.env.CRAYS_QA_PREAUTHORIZE === '0' ? [] : [qaUser]),
].map((user) => [user.pub, user])).values()];
for (const user of authorizedUsers) {
  await publish(
    signEvent({ kind: 8, tags: [['a', requiredBadge], ['p', user.pub]] }, issuerSecret),
    `fixture membership award for ${user.pub.slice(0, 8)}`,
  );
}
await sleep(2500);

const expires = nowSeconds() + fixtureTtlSeconds;
const manifest = signEvent(
  {
    kind: 30078,
    tags: [
      ['d', `life.crays/room/v1/${roomId}`],
      ['schema', 'life.crays/room/v1'],
      ['name', roomDisplayName],
      ['about', ROOM_ABOUT],
      ['relay', relay.relay_url],
      ['operator', keys.admin.pub],
      ['award_issuer', requiredBadge.split(':')[1]],
      ['g', 'u0u67'],
      ['capability', 'social'],
      ['capability', 'menu'],
      ['capability', 'events'],
      ['capability', 'membership'],
      ['open', 'open'],
      ['expiration', String(expires)],
    ],
  },
  keys.admin.priv,
);
await publish(manifest, 'versioned room manifest');

const people = FIXTURE_PEOPLE;
const profileIds = [];
const presenceIds = [];
for (let index = 0; index < fixtureUsers.length; index += 1) {
  const user = fixtureUsers[index];
  const [personName, about] = people[index];
  const personProfile = signEvent({ kind: 0, content: JSON.stringify({ name: personName, display_name: personName, about }) }, user.priv);
  await publish(personProfile, `${personName} profile`);
  profileIds.push(personProfile.id);
  const presence = signEvent(
    {
      kind: 78,
      tags: [
        ['d', `life.crays/presence/v1/${roomId}/${user.pub}`],
        ['schema', 'life.crays/presence/v1'],
        ['type', 'presence'],
        ['h', roomId],
        ['visibility', 'visible'],
        ['intent', index === 0 ? 'Open to chat' : 'Enjoying the room'],
        ['expiration', String(nowSeconds() + Math.min(fixtureTtlSeconds, 86_400))],
      ],
    },
    user.priv,
  );
  await publish(presence, `${personName} visible presence`);
  presenceIds.push(presence.id);
}

const incomingMessageId = `incoming-${run}`;
const incomingPlaintext = JSON.stringify({ schema: 'life.crays/dm/v1', messageId: incomingMessageId, messageType: 'message-request', text: 'Want to hear the second set?', roomId, roomName: roomDisplayName });
const incomingDirectMessage = signEvent({ kind: 4, content: nip04.encrypt(fixtureUsers[1].priv, fixtureUsers[0].pub, incomingPlaintext), tags: [['p', fixtureUsers[0].pub]] }, fixtureUsers[1].priv);
await publish(incomingDirectMessage, 'incoming Jonas NIP-04 direct-message request');

const feedEvents = [
  signEvent({ kind: 1, content: 'Rooftop Jazz starts at 20:30. Last tables are on the east side.', tags: [['h', roomId], ['type', 'announcement'], ['expiration', String(expires)]] }, keys.admin.priv),
  signEvent({ kind: 1, content: 'The mezcal negroni is excellent.', tags: [['h', roomId], ['expiration', String(expires)]] }, fixtureUsers[0].priv),
  signEvent({ kind: 1, content: 'Anyone heading downstairs for the late set?', tags: [['h', roomId], ['expiration', String(expires)]] }, fixtureUsers[1].priv),
];
for (const [index, event] of feedEvents.entries()) await publish(event, `room feed event ${index + 1}`);

const products = FIXTURE_PRODUCTS;
const definitionIds = [];
const productAddresses = [];
for (const [position, [d, productName, description, price, section, productKind]] of products.entries()) {
  const product = signEvent(
    {
      kind: 30009,
      tags: [
        ['d', `${d}-${run}`], ['type', 'product'], ['t', 'product'], ['t', 'sellable'],
        ['name', productName], ['description', description], ['price', price, 'EUR'],
        ['position', String(position)], ['availability', 'available'], ['product_kind', productKind],
        ['max_uses', '1'], ['section', section], ['r', relay.relay_url],
      ],
    },
    keys.admin.priv,
  );
  await publish(product, `${productName} definition`);
  definitionIds.push(product.id);
  productAddresses.push(`30009:${keys.admin.pub}:${d}-${run}`);
}

const orderRef = `CR-${run.toUpperCase()}`;
const orderAward = signEvent(
  {
    kind: 8,
    tags: [
      ['a', productAddresses[0]], ['p', fixtureUsers[0].pub], ['order', orderRef],
      ['i', `payment-redemption:${orderRef}`], ['payment', `qa-payment-${run}`],
    ],
  },
  issuerSecret,
);
await publish(orderAward, 'member product award for live order');
const orderStatus = signEvent(
  {
    kind: 37237,
    tags: [
      ['status', 'ready'], ['a', productAddresses[0]], ['e', orderAward.id],
      ['p', fixtureUsers[0].pub], ['order', orderRef], ['d', `order:${orderRef}`],
    ],
  },
  keys.admin.priv,
);
await publish(orderStatus, 'ready order status');

const membership = signEvent(
  {
    kind: 30009,
    tags: [
      ['d', `skyline-regular-${run}`], ['type', 'membership'], ['t', 'membership'], ['t', 'sellable'],
      ['name', FIXTURE_MEMBERSHIP_NAME], ['description', 'Member nights, one monthly cocktail, and priority booking.'],
      ['price', '24.00', 'EUR'], ['billing', 'monthly'], ['availability', 'available'], ['position', '10'],
    ],
  },
  keys.admin.priv,
);
await publish(membership, 'membership definition');
const membershipAddress = `30009:${keys.admin.pub}:skyline-regular-${run}`;
const membershipAward = signEvent(
  { kind: 8, tags: [['a', membershipAddress], ['p', fixtureUsers[0].pub], ['i', `invite-grant:${run}`]] },
  issuerSecret,
);
await publish(membershipAward, 'member durable membership award');

const passDefinition = signEvent(
  {
    kind: 30009,
    tags: [
      ['d', `skyline-three-visits-${run}`], ['type', 'pass'], ['t', 'pass'],
      ['name', 'Skyline three-visit pass'], ['description', 'Three entries to Skyline member nights.'],
      ['price', '30.00', 'EUR'], ['max_uses', '3'], ['availability', 'available'], ['position', '11'],
    ],
  },
  keys.admin.priv,
);
await publish(passDefinition, 'multi-use pass definition');
const passAddress = `30009:${keys.admin.pub}:skyline-three-visits-${run}`;
const passAward = signEvent(
  { kind: 8, tags: [['a', passAddress], ['p', fixtureUsers[0].pub], ['order', `PASS-${run.toUpperCase()}`]] },
  issuerSecret,
);
await publish(passAward, 'member multi-use pass award');
const passUse = signEvent(
  {
    kind: 37237,
    tags: [
      ['status', 'fulfilled'], ['a', passAddress], ['e', passAward.id], ['p', fixtureUsers[0].pub],
      ['order', `checkin-${run}-one`], ['d', `order:checkin-${run}-one`],
    ],
  },
  keys.admin.priv,
);
await publish(passUse, 'one fulfilled pass use');

const eventD = `rooftop-jazz-${run}`;
const calendarEvent = signEvent(
  {
    kind: 31923,
    tags: [
      ['d', eventD], ['title', FIXTURE_EVENT_TITLE], ['start', String(nowSeconds() + 1800)],
      ['end', String(nowSeconds() + 10_800)], ['location', 'Roof stage'],
      ['summary', 'Live jazz under the stars with the city skyline as your backdrop.'],
      ['capacity', '18'], ['price', '0.00', 'EUR'], ['r', relay.relay_url],
    ],
  },
  keys.admin.priv,
);
await publish(calendarEvent, 'calendar event');

const eventAccessDefinition = signEvent(
  {
    kind: 30009,
    tags: [
      ['d', `rooftop-jazz-ticket-${run}`], ['type', 'event_access'], ['t', 'event_access'],
      ['name', 'Rooftop Jazz entry'], ['description', 'Door entry for the Rooftop Jazz set.'],
      ['price', '0.00', 'EUR'], ['max_uses', '1'], ['availability', 'available'],
      ['a', `31923:${keys.admin.pub}:${eventD}`],
    ],
  },
  keys.admin.priv,
);
await publish(eventAccessDefinition, 'event access definition');
const eventAccessAddress = `30009:${keys.admin.pub}:rooftop-jazz-ticket-${run}`;
const eventAccessAward = signEvent(
  { kind: 8, tags: [['a', eventAccessAddress], ['p', fixtureUsers[0].pub], ['event', `31923:${keys.admin.pub}:${eventD}`]] },
  issuerSecret,
);
await publish(eventAccessAward, 'member event access award');

const counts = await pool.querySync([relay.relay_url], { kinds: [0, 1, 4, 8, 78, 30009, 30078, 31923], limit: 100 });
assert(counts.length >= 15, `independent relay query sees complete fixture family (${counts.length} events)`);
pool.close([relay.relay_url]);

writeState({
  run,
  id: created.id,
  name,
  room_id: roomId,
  room_name: roomDisplayName,
  domain: relay.domain,
  relay_url: relay.relay_url,
  emulator_relay_url: emulatorUrl(relay.relay_url),
  base_url: relay.base_url,
  emulator_base_url: emulatorUrl(relay.base_url),
  operator_pubkey: keys.admin.pub,
  required_badge: requiredBadge,
  manifest_id: manifest.id,
  profile_ids: profileIds,
  presence_ids: presenceIds,
  feed_ids: feedEvents.map((event) => event.id),
  definition_ids: [...definitionIds, membership.id, passDefinition.id, eventAccessDefinition.id],
  event_id: calendarEvent.id,
  event_address: `31923:${keys.admin.pub}:${eventD}`,
  membership_definition_id: membership.id,
  order_award_id: orderAward.id,
  order_status_id: orderStatus.id,
  membership_award_id: membershipAward.id,
  pass_award_id: passAward.id,
  pass_status_id: passUse.id,
  event_access_award_id: eventAccessAward.id,
  order_ref: orderRef,
  invite_token: invite.token,
  invite_expires_at: invite.expires_at,
  qa_pubkey: qaUser.pub,
  fixture_pubkeys: fixtureUsers.map((user) => user.pub),
  incoming_message_event_id: incomingDirectMessage.id,
  incoming_message_id: incomingMessageId,
  phase: 'ready',
});
console.log('CRAYS RELAY BOOTSTRAP PASS');

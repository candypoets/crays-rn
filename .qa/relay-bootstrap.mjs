#!/usr/bin/env node
import { getPublicKey, nip04 } from 'nostr-tools';
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
  deleteFixtureEvents,
  emulatorUrl,
  ensureFixtureCleanupCapability,
  fixtureAddressD,
  fixtureSignerMap,
  fixtureUsersAtOffset,
  getRelaySecrets,
  loadKeys,
  makePool,
  nip98Header,
  nowSeconds,
  publishUntilStored,
  publishedTestRoomEventIds,
  queryFixtureEvents,
  queryUntil,
  requireCoordinator,
  reserveOrReuseRelay,
  signEvent,
  sleep,
  writeState,
} from './relay-lib.mjs';

const keys = loadKeys();
const protectedPublishedFixtureIds = publishedTestRoomEventIds();
const run = Date.now().toString(36);
const roomDisplayName = process.env.CRAYS_TEST_ROOM_NAME || ROOM_DISPLAY_NAME;
const roomId = process.env.CRAYS_TEST_ROOM_ID || 'crays-qa-skyline';
const persistentFixtures = process.env.CRAYS_PERSIST_TEST_ROOM_FIXTURES === '1';
const addressD = (value) => fixtureAddressD(value, roomId, persistentFixtures);
const MAX_TEST_ROOM_TTL_SECONDS = 90 * 24 * 60 * 60;
const fixtureTtlSeconds = Math.min(MAX_TEST_ROOM_TTL_SECONDS, Math.max(3_600, Number(process.env.CRAYS_TEST_ROOM_TTL_SECONDS || 86_400)));
if (!Number.isSafeInteger(fixtureTtlSeconds)) throw new Error('CRAYS_TEST_ROOM_TTL_SECONDS must be an integer number of seconds');

await requireCoordinator();
const relay = await reserveOrReuseRelay(keys);
assert(relay.relay_url.startsWith('wss://'), `reserved room relay running at ${relay.relay_url}`);
const secrets = await getRelaySecrets(relay.id, keys);
const issuerSecret = secrets.badge_issuer_secret_key;
if (!/^[0-9a-f]{64}$/i.test(issuerSecret || '')) throw new Error('reserved relay did not expose a badge issuer secret');
const badgeIssuerPubkey = getPublicKey(Uint8Array.from(Buffer.from(issuerSecret, 'hex')));
const communityRoot = relay.required_badge.split(':')[1];
const requiredBadge = relay.required_badge;
if (!/^30009:[0-9a-f]{64}:members$/i.test(requiredBadge || '')) {
  throw new Error('reserved relay did not expose its required membership badge address');
}
writeState({
  run,
  id: relay.id,
  name: relay.name,
  room_id: roomId,
  room_name: roomDisplayName,
  domain: relay.domain,
  relay_url: relay.relay_url,
  emulator_relay_url: emulatorUrl(relay.relay_url),
  base_url: relay.base_url,
  emulator_base_url: emulatorUrl(relay.base_url),
  operator_pubkey: keys.admin.pub,
  required_badge: requiredBadge,
  community_root: communityRoot,
  badge_issuer_pubkey: badgeIssuerPubkey,
  badge_issuer_secret_key: issuerSecret,
  phase: 'reserved',
});

const pool = makePool();
let testRoomMembershipDefinitionId;
if (process.env.CRAYS_TEST_ROOM_PRESENCE === '1') {
  const rootSecret = secrets.community_root_secret_key;
  if (!/^[0-9a-f]{64}$/i.test(rootSecret || '')) throw new Error('Test Room presence setup requires its community root secret');
  const definitionD = requiredBadge.split(':').slice(2).join(':');
  const requiredKinds = ['0', '1', '4', '10312'];
  const hasExactPermissions = (event) => {
    const permissions = event?.tags.filter((tag) => tag[0] === 'permission') || [];
    return permissions.length === requiredKinds.length && requiredKinds.every((kind) => permissions.some(
      (tag) => tag.length === 3 && tag[1] === kind && tag[2] === 'write',
    ));
  };
  const currentDefinitions = await pool.querySync(
    [relay.relay_url],
    { kinds: [30009], authors: [communityRoot], '#d': [definitionD], limit: 10 },
  );
  const current = currentDefinitions.sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))[0];
  const hasRequiredPermissions = hasExactPermissions(current);
  if (!hasRequiredPermissions) {
    const definition = signEvent(
      {
        kind: 30009,
        created_at: Math.max(nowSeconds(), Number(current?.created_at || 0) + 1),
        tags: [
          ['d', definitionD],
          ['name', 'Member'],
          ['description', 'Community membership'],
          ['t', 'membership'],
          ['price', '0', 'SAT'],
          ...requiredKinds.map((kind) => ['permission', kind, 'write']),
        ],
      },
      rootSecret,
    );
    await publishUntilStored(pool, relay.relay_url, definition, 'Test Room member write permissions');
  }
  const { result: compatibleDefinition } = await queryUntil(
    pool,
    relay.relay_url,
    { kinds: [30009], authors: [communityRoot], '#d': [definitionD], limit: 10 },
    (events) => events.find(hasExactPermissions),
    'Test Room social membership definition is readable',
  );
  testRoomMembershipDefinitionId = compatibleDefinition.id;
  // Let the external gate observe the addressable replacement before invite
  // recipients exercise the NIP-53 presence write in the current app.
  await sleep(1_000);
}
const fixtureUsers = fixtureUsersAtOffset(keys.users, Number(process.env.CRAYS_FIXTURE_USER_OFFSET || 0));
const qaUserIndex = Number(process.env.CRAYS_QA_USER_INDEX || 0);
const qaUser = keys.users[qaUserIndex];
if (!qaUser) throw new Error(`CRAYS_QA_USER_INDEX ${qaUserIndex} has no fixture key`);
const authorizedUsers = [...new Map([
  ...fixtureUsers,
  ...(process.env.CRAYS_QA_PREAUTHORIZE === '0' ? [] : [qaUser]),
].map((user) => [user.pub, user])).values()];

// A live relay persists between scenarios. First establish a temporary,
// UI-invisible NIP-97 capability so every original fixture author can remove
// its own old events under NIP-09. Preserve only this run's capability while
// sweeping; teardown removes it after all user-authored events.
//
// The switch-room scenario seeds two signed NIP-53 room definitions on the one
// coordinator-reserved relay. The deployed coordinator limits this owner to
// that relay, so its second bootstrap must preserve room A while adding room
// B. All other scenarios retain the default cleanup behavior.
const preserveExistingFixtures = process.env.CRAYS_QA_PRESERVE_FIXTURES === '1';
const { signers } = fixtureSignerMap(keys, issuerSecret);
const leftovers = await queryFixtureEvents(pool, relay.relay_url, signers, badgeIssuerPubkey);
const ordinaryLeftoverAuthors = leftovers
  .map((event) => event.pubkey)
  .filter((pubkey) => pubkey !== keys.admin.pub && pubkey !== badgeIssuerPubkey);
const cleanupCapability = await ensureFixtureCleanupCapability(
  pool,
  relay.relay_url,
  keys,
  issuerSecret,
  [...ordinaryLeftoverAuthors, ...authorizedUsers.map((user) => user.pub)],
);
const capabilityIds = [cleanupCapability.definition.id, ...cleanupCapability.awards.map((award) => award.id)];
if (preserveExistingFixtures) {
  assert(Boolean(process.env.CRAYS_TEST_ROOM_ID), 'preserved fixture bootstrap names its room explicitly');
  console.log(`ok - preserving existing fixture family while seeding room ${roomId}`);
} else {
  await deleteFixtureEvents({
    pool,
    relayUrl: relay.relay_url,
    keys,
    badgeIssuerSecret: issuerSecret,
    communityRoot,
    excludeIds: [...capabilityIds, ...protectedPublishedFixtureIds],
    label: 'pre-seed sweep',
  });
}

const inviteTtlSeconds = Number(process.env.CRAYS_INVITE_TTL_SECONDS || 3600);
let invite;
if (process.env.CRAYS_QA_MINT_INVITE !== '0') {
  const inviteEndpoint = `${relay.base_url}/invites`;
  const badgeTtlSeconds = Number(process.env.CRAYS_BADGE_TTL_SECONDS || 604800);
  const inviteMaxRedemptions = Number(process.env.CRAYS_INVITE_MAX_REDEMPTIONS || 5);
  if (!Number.isSafeInteger(inviteTtlSeconds) || inviteTtlSeconds < 1) throw new Error('CRAYS_INVITE_TTL_SECONDS must be a positive integer');
  if (!Number.isSafeInteger(badgeTtlSeconds) || badgeTtlSeconds < 0) throw new Error('CRAYS_BADGE_TTL_SECONDS must be a non-negative integer');
  if (!Number.isSafeInteger(inviteMaxRedemptions) || inviteMaxRedemptions < 1) throw new Error('CRAYS_INVITE_MAX_REDEMPTIONS must be a positive safe integer');
  const inviteBody = JSON.stringify({
    expires_in_seconds: inviteTtlSeconds,
    ...(badgeTtlSeconds > 0 ? { badge_expires_in_seconds: badgeTtlSeconds } : {}),
    max_redemptions: inviteMaxRedemptions,
  });
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
  const inviteClaims = JSON.parse(Buffer.from(invite.token.split('.')[0], 'base64url').toString('utf8'));
  const remainingInviteSeconds = Number(invite.expires_at) - nowSeconds();
  assert(remainingInviteSeconds >= inviteTtlSeconds - 60 && remainingInviteSeconds <= inviteTtlSeconds + 5, `invite service honored the requested ${inviteTtlSeconds}-second lifetime`);
  assert(inviteClaims.exp === invite.expires_at, 'invite response and signed claims have the same expiry');
  assert(invite.max_redemptions === inviteMaxRedemptions && inviteClaims.max === inviteMaxRedemptions, 'invite service preserved the requested redemption allowance');
  assert(badgeTtlSeconds > 0 ? Number.isSafeInteger(inviteClaims.badge_exp) : inviteClaims.badge_exp === undefined, badgeTtlSeconds > 0 ? 'invite carries the requested membership expiry' : 'invite grants membership without an award expiry');
}
const publish = async (event, label) => {
  await publishUntilStored(pool, relay.relay_url, event, label);
};
let venueProfile;
if (persistentFixtures || protectedPublishedFixtureIds.length === 0) {
  venueProfile = signEvent(
    { kind: 0, content: JSON.stringify({ name: roomDisplayName, about: 'Rooftop jazz, drinks and late-night company.' }) },
    keys.admin.priv,
  );
  await publish(venueProfile, 'venue kind-0 round-trips after the write gate is ready');
} else {
  console.log('ok - protected published Test Room owns the venue kind-0 coordinate');
}

// Authorize deterministic people so their own signed profile/feed/presence
// fixtures pass the exact membership gate the app will encounter.
for (const user of authorizedUsers) {
  await publish(
    signEvent({ kind: 8, tags: [['a', requiredBadge], ['p', user.pub], ['t', '30009'], ['t', 'membership']] }, issuerSecret),
    `fixture membership award for ${user.pub.slice(0, 8)}`,
  );
}
await sleep(2500);

// NIP-97 trust chain the app will resolve: the relay's NIP-11 root key signs
// the community anchor (31727), which delegates to the badge issuer. Assert
// the live community metadata independently here.
const nip11Response = await fetch(relay.relay_url.replace(/^ws/, 'http'), { headers: { accept: 'application/nostr+json' } });
assert(nip11Response.ok, 'relay serves its NIP-11 document');
const nip11 = await nip11Response.json();
assert(nip11.pubkey === communityRoot, 'relay NIP-11 publishes the community root key');
const { result: anchor } = await queryUntil(
  pool,
  relay.relay_url,
  { kinds: [31727], authors: [communityRoot], '#d': ['community'], limit: 5 },
  (events) => events.sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))[0],
  'live relay exposes the root-signed community anchor',
);
assert(anchor.tags.some((tag) => tag[0] === 'p' && tag[1] === keys.admin.pub), 'anchor lists the scenario admin');
assert(anchor.tags.some((tag) => tag[0] === 'badge_issuer' && tag[1] === badgeIssuerPubkey), 'anchor delegates to the badge issuer');

const expires = nowSeconds() + fixtureTtlSeconds;
const roomDefinition = signEvent(
  {
    kind: 30312,
    tags: [
      ['d', roomId],
      ['room', roomDisplayName],
      ['summary', ROOM_ABOUT],
      ['status', 'open'],
      ['service', relay.base_url],
      ['p', keys.admin.pub, relay.relay_url, 'Host'],
      ['relays', relay.relay_url],
      ['g', 'u0u67'],
      ['t', 'social'],
      ['t', 'menu'],
      ['t', 'events'],
      ['t', 'membership'],
    ],
  },
  keys.admin.priv,
);
await publish(roomDefinition, 'root-authorized NIP-53 room definition');
const roomAddress = `30312:${keys.admin.pub}:${roomId}`;

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
      kind: 10312,
      tags: [
        ['a', roomAddress, relay.relay_url, 'root'],
        ['intent', index === 0 ? 'Open to chat' : 'Enjoying the room'],
        ['expiration', String(nowSeconds() + fixtureTtlSeconds)],
      ],
    },
    user.priv,
  );
  await publish(presence, `${personName} visible presence`);
  presenceIds.push(presence.id);
}

const incomingMessageId = 'incoming-crays-qa';
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
for (const [position, [baseD, productName, description, price, section, productKind]] of products.entries()) {
  const d = addressD(baseD);
  const product = signEvent(
    {
      kind: 30402,
      tags: [
        ['d', d], ['t', 'product'], ['title', productName], ['summary', description], ['price', price, 'EUR'],
        ['position', String(position)], ['availability', 'available'], ['status', 'active'],
        ['product_kind', productKind], ['max_uses', '1'],
        ['section', section], ['r', relay.relay_url],
      ],
    },
    keys.admin.priv,
  );
  await publish(product, `${productName} listing`);
  definitionIds.push(product.id);
  productAddresses.push(`30402:${keys.admin.pub}:${d}`);
}

const orderRef = persistentFixtures ? 'CR-QA-READY' : `CR-QA-READY-${roomId}`;
const orderAward = signEvent(
  {
    kind: 8,
    tags: [
      ['a', productAddresses[0]], ['p', fixtureUsers[0].pub], ['order', orderRef],
      ['i', `payment-redemption:${orderRef}`], ['payment', 'qa-payment-ready'], ['t', '30402'],
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

const membershipD = addressD('skyline-regular');
const membership = signEvent(
  {
      kind: 30009,
      tags: [
      ['d', membershipD], ['t', 'membership'],
      ['name', FIXTURE_MEMBERSHIP_NAME], ['description', 'Member nights, one monthly cocktail, and priority booking.'],
      ['price', '24.00', 'EUR', 'month'], ['availability', 'available'],
    ],
  },
  keys.admin.priv,
);
await publish(membership, 'membership definition');
const membershipAddress = `30009:${keys.admin.pub}:${membershipD}`;
const membershipAward = signEvent(
  { kind: 8, tags: [['a', membershipAddress], ['p', fixtureUsers[0].pub], ['i', 'invite-grant:crays-qa'], ['t', '30009'], ['t', 'membership']] },
  issuerSecret,
);
await publish(membershipAward, 'member durable membership award');

const passD = addressD('skyline-three-visits');
const passDefinition = signEvent(
  {
      kind: 30402,
      tags: [
      ['d', passD], ['title', 'Skyline three-visit pass'],
      ['summary', 'Three entries to Skyline member nights.'],
      ['price', '30.00', 'EUR'], ['max_uses', '3'], ['availability', 'available'],
    ],
  },
  keys.admin.priv,
);
await publish(passDefinition, 'multi-use pass listing');
const passAddress = `30402:${keys.admin.pub}:${passD}`;
const passAward = signEvent(
  { kind: 8, tags: [['a', passAddress], ['p', fixtureUsers[0].pub], ['order', 'PASS-CRAYS-QA'], ['t', '30402']] },
  issuerSecret,
);
await publish(passAward, 'member multi-use pass award');
const passUse = signEvent(
  {
    kind: 37237,
    tags: [
      ['status', 'fulfilled'], ['a', passAddress], ['e', passAward.id], ['p', fixtureUsers[0].pub],
      ['order', `checkin:${roomId}:one`], ['d', addressD('order:checkin-crays-qa-one')],
    ],
  },
  keys.admin.priv,
);
await publish(passUse, 'one fulfilled pass use');

const eventD = addressD('rooftop-jazz');
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

const eventAccessD = addressD('rooftop-jazz-ticket');
const eventAccessDefinition = signEvent(
  {
      kind: 30402,
      tags: [
      ['d', eventAccessD], ['title', 'Rooftop Jazz entry'],
      ['summary', 'Door entry for the Rooftop Jazz set.'],
      ['price', '0.00', 'EUR'], ['max_uses', '1'], ['availability', 'available'],
      ['a', `31923:${keys.admin.pub}:${eventD}`],
    ],
  },
  keys.admin.priv,
);
await publish(eventAccessDefinition, 'event access listing');
const eventAccessAddress = `30402:${keys.admin.pub}:${eventAccessD}`;
const eventAccessAward = signEvent(
  { kind: 8, tags: [['a', eventAccessAddress], ['p', fixtureUsers[0].pub], ['event', `31923:${keys.admin.pub}:${eventD}`], ['t', '30402'], ['t', 'event_access']] },
  issuerSecret,
);
await publish(eventAccessAward, 'member event access award');

const { events: counts } = await queryUntil(
  pool,
  relay.relay_url,
  { kinds: [0, 1, 4, 8, 10312, 30009, 30312, 30402, 31727, 31923], limit: 100 },
  (events) => events.length >= 15,
  'complete fixture family after seed',
);
assert(counts.length >= 15, `independent relay query sees complete fixture family (${counts.length} events)`);
pool.close([relay.relay_url]);

writeState({
  run,
  id: relay.id,
  name: relay.name,
  room_id: roomId,
  room_name: roomDisplayName,
  domain: relay.domain,
  relay_url: relay.relay_url,
  emulator_relay_url: emulatorUrl(relay.relay_url),
  base_url: relay.base_url,
  emulator_base_url: emulatorUrl(relay.base_url),
  operator_pubkey: keys.admin.pub,
  required_badge: requiredBadge,
  community_root: communityRoot,
  badge_issuer_pubkey: badgeIssuerPubkey,
  badge_issuer_secret_key: issuerSecret,
  nip11_document: nip11,
  ...(testRoomMembershipDefinitionId ? { test_room_membership_definition_id: testRoomMembershipDefinitionId } : {}),
  cleanup_capability_definition_id: cleanupCapability.definition.id,
  cleanup_capability_award_ids: cleanupCapability.awards.map((award) => award.id),
  anchor_id: anchor.id,
  ...(venueProfile ? { venue_profile_id: venueProfile.id } : {}),
  room_definition_id: roomDefinition.id,
  room_address: roomAddress,
  profile_ids: profileIds,
  presence_ids: presenceIds,
  feed_ids: feedEvents.map((event) => event.id),
  definition_ids: [...definitionIds, membership.id, passDefinition.id, eventAccessDefinition.id],
  product_addresses: productAddresses,
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
  ...(invite ? {
    invite_token: invite.token,
    invite_expires_at: invite.expires_at,
    invite_ttl_seconds: inviteTtlSeconds,
    invite_max_redemptions: invite.max_redemptions,
    invite_badge_expires_at: invite.badge_expires_at,
  } : {}),
  qa_pubkey: qaUser.pub,
  fixture_pubkeys: fixtureUsers.map((user) => user.pub),
  incoming_message_event_id: incomingDirectMessage.id,
  incoming_message_id: incomingMessageId,
  phase: 'ready',
});
console.log('CRAYS RELAY BOOTSTRAP PASS');

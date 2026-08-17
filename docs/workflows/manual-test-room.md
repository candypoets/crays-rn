# Workflow — Test Room for development and TestFlight

## Product contract

The Test Room is an intentionally permissive test community. Development
clients and builds compiled with `EXPO_PUBLIC_CRAYS_TEST_BUILD=1` show one
fixed **Crays Test Room** card on Discover. Ordinary release builds do not
subscribe to or display it.

The card is a synthetic Nearby result. It constructs the same version-2 nearby
pointer that a real BLE GATT characteristic exposes: relay URL,
room id, public invite-service URL, and the broadcast invite token. It then
uses the normal pointer parser and navigation parameters. It bypasses only the
radio scan and permission prompt; it does not bypass invite, the pinned
relay's NIP-11 root, the root-signed kind-31727 anchor and current admins, the
authorized NIP-53 kind-30312 room definition, the award, or relay
verification. The preview resolves that room definition through the same
anchor-backed trust path as production and retains its exact
`30312:<author>:<d>` address for presence.

The credential is public by design because a physical room advertises it to
anyone nearby. It expires 90 days after minting and allows
`Number.MAX_SAFE_INTEGER` redemptions, which is effectively unlimited for this
test community. The token itself expires; membership awards redeemed from it
do not. A new token must be compiled into a TestFlight build before the
90-day deadline.

Entry remains a privacy boundary:

- Quiet entry never resolves, previews, or redeems the invite and never
  publishes presence.
- Visible entry redeems for the current account, reads the exact returned
  kind-8 award back from the pinned room relay, validates it against the
  relay's NIP-11 root, root-signed community anchor/current admins, and
  authorized room definition, and only then exercises the normal kind-0
  profile plus kind-10312 presence path bound to the exact room-definition
  address.
- A failed, expired, exhausted, wrong-room, wrong-issuer, or delayed award stays
  on Join privacy with a retryable error. It never shows false entry.
- A cached Test Room redemption is re-confirmed on every visible entry. When
  the exact relay's network EOSE proves that its award disappeared, only this
  effectively unlimited public test token is redeemed again; finite invites
  are never consumed twice.

No local invite endpoint or handoff proxy is part of this workflow. TestFlight
users contact the hosted community invite service directly.

## Publishing and building

Run this once to publish a 90-day signed fixture and mint its public credential:

```sh
npm run test-room:publish
```

The command queries the real coordinator, publishes to the hosted Test Room,
and writes ignored `.env.test-room-build`. It fails if the invite service
silently clamps the requested lifetime below 90 days. Export that generated
file into the process that creates the TestFlight bundle; Expo replaces the
`EXPO_PUBLIC_*` values at bundle time. The resulting app needs no developer
machine or proxy at runtime.

For a teardown-owned local session, run `npm run test-room`. It provisions the
same real contract and stays alive only to own fixture cleanup on Ctrl-C or
`npm run test-room:stop`; app traffic still goes directly to the hosted relay
and invite service. `CRAYS_TEST_ROOM_PROXY=1` is an optional WebSocket relay
compatibility aid for a development device that cannot reach hosted WSS. It
does not expose or forward invite endpoints.

## QA strategy

`.qa/qa-test-room.mjs` owns bootstrap, native exercise, independent
verification, and teardown. Bootstrap asks the real invite service for exactly
7,776,000 seconds, omits membership-award expiry, requests
9,007,199,254,740,991 redemptions, and rejects a clamped response. The QA-only
seed route injects that per-run public credential into `createTestRoomPointer`;
release builds cannot use this route.

All relay-backed QA scenarios protect the event IDs recorded by the published
Test Room state at `/tmp/crays-manual-test-room.json`. Their pre-seed sweep and
teardown may add and remove scenario events from the shared reserved relay, but
must not delete the persistent room definition, catalog, profiles, presences,
entitlements, or venue profile recorded by `npm run test-room:publish`.
Published people use a dedicated fixture-key window; ephemeral scenarios use
separate fixture identities, namespace every addressable `d` coordinate by
room id, and do not overwrite the published admin's replaceable kind-0 profile.
This matters because deleting a newer Nostr replacement does not restore the
older event it superseded. Publishing the room itself uses its own state path
and therefore intentionally replaces its prior fixture family.

`maestro/flows/test-room.yaml` provides these inputs: hosted service URL,
hosted WSS relay, Test Room id, direct invite token, signer identity, visible
intent, and context. Its expected output is Discover card → verified preview →
visible privacy choice → People, without the Bluetooth rationale.

Independent verifiers then require:

- the exact fresh NIP-53 kind-30312 room definition authored by an anchor-listed
  admin, with its room id, service, Host provider, and exact address;
- an issuer-signed membership award with the token nonce, badge address, app
  pubkey, no award expiry, and the exact event id the app confirmed;
- one valid app-authored kind-10312 visible-presence event, published only
  after that award, linked to the exact
  `30312:<room-author>:<room-id>` address, with the selected intent, context,
  and one-hour expiry;
- one valid app-authored kind-0 profile carrying the exact test display name;
- complete author-scoped scenario teardown from the shared reserved relay,
  while the recorded published Test Room fixture remains queryable.

Cleanup treats the shared badge issuer carefully: it removes awards addressed
to harness fixture identities, but preserves issuer awards granted to unrelated
Test Room visitors. A developer QA run therefore cannot revoke another
device's redeemed membership.

Additional manual paths are quiet entry with zero redemption, token expiry,
wrong-room service metadata, missing root anchor, delayed award read-back,
relay offline, ordinary release build with no card, and a TestFlight install on
a device that has no access to the development host.

The Test Room keeps a root-signed membership definition granting kind `10312`
write permission so the TestFlight build exercises the same relay gate as
production.

# Crays QA harness

Every screen and every workflow has a named scenario here. UI automation lives
in `maestro/flows/`; orchestration, infrastructure setup, independent truth
checks, and teardown live in `.qa/`.

Every scenario follows the same lifecycle:

1. **Bootstrap** creates isolated device and infrastructure state and emits
   only non-secret fixture values.
2. **Exercise** drives public app UI through a screen-specific Maestro flow.
3. **Verify** checks truth independently of rendered UI. For local identity
   this means cryptographic signature verification; for relay features it means
   querying the provisioned relay for exact kinds, authors, tags, replacement
   semantics, and side effects.
4. **Teardown** clears the exact app package and removes only services/data the
   scenario created.

`npm run qa:contracts` is the fast structural gate: every file under
`docs/screens/` must be registered with an existing Maestro flow and a named
`.qa` lifecycle runner. It also fails when a runner does not reference its
registered flow (or references a missing one), when a flow does not reach the
shared `maestro/flows/launch.yaml` startup transitively, or when a screen has
no mapped jest test (`screenTests` in `verify-screen-contracts.mjs`;
`entry-router.md` is covered directly). Scenarios that harden an
existing spec rather than add a screen are registered in
`additionalScenarios`. This catches a newly added screen spec that has no
executable QA scaffold before device tests begin.

## Verifier conventions

- Positive relay verifiers poll with `queryUntil` (default 15s) from
  `relay-lib.mjs`; a one-shot `querySync` flakes whenever relay propagation
  lags a confirmed write.
- Negative (absence) verifiers call `settleBeforeAbsence` (4s) before
  querying, so a lagging write cannot produce a false pass.
- Strings shared between flows and verifiers live in `flow-fixtures.mjs`.
  `relay-screen-scenario.mjs` passes them to flows as `QA_*` Maestro env
  vars; flows using them require the harness or explicit `-e` overrides when
  run standalone. The entry flows are launched without env overrides and keep
  their literals; the owning flow for each constant is named in
  `flow-fixtures.mjs`.
- Logcat consumption verifiers (`verify-room-definition-consumed`,
  `verify-room-consumed`, `verify-order-consumed`) independently query the
  relay for the underlying events and their seeded content first; the logcat
  `__DEV__` marker check only complements that proof.
- A failed teardown prints the leaked relay name and the exact `--sweep`
  recovery command; a passing scenario keeps its PASS, while a scenario that
  already failed still exits non-zero.

## Negative-path scenarios

- `qa-08b-invite-redeemed-twice.mjs` redeems the same invite token twice
  through the public UI. Per `redeemInvite` in `src/invites/invites.ts` the
  correct behavior is idempotent reuse of the stored nonce/account
  redemption; the verifier requires exactly one relay award for the nonce and
  exactly one redemption marker.
- `qa-20d-rsvp-rejected.mjs` runs the RSVP flow with an app identity that
  holds no membership badge (`CRAYS_QA_PREAUTHORIZE=0`, user index 3), so the
  badge-gated relay rejects the write. The flow asserts the event error
  state and the empty Tickets archive; the verifier proves the relay stored
  no kind-31925 and no confirmed-RSVP marker was logged, so nothing entered
  the durable archive.
- `qa-11c-join-relay-unavailable.mjs` points join-room at a dead relay URL
  and asserts the room-definition error state renders instead of a hang. It
  provisions no relay, so it has nothing to tear down.

## Entry and cold signup

The current entry scenarios are:

- `qa-06-cold-welcome.mjs`
- `qa-06b-account-access.mjs`
- `qa-07-account-setup.mjs`
- `qa-07b-account-recovery.mjs`
- `qa-27-discover-handoff.mjs` — temporary destination plus account verifier
- `qa-cold-signup.mjs` — complete workflow plus independent kind-0 verifier

They use `qa-entry-lib.mjs`, `qa-entry-bootstrap.mjs`,
`qa-entry-verify.mjs`, and `qa-entry-teardown.mjs`. The verifier reads the
public-safe signed event marker from Android logcat, verifies its Nostr
signature and expected profile content with `nostr-tools`, and asserts that
each expected identity/profile/completion side effect occurs exactly once and
onboarding opened zero relay connections/subscriptions. Screen scenarios also
relaunch at their persistence boundary and assert the entry router resumes at
the correct next screen. The private key is never logged or written to QA
state.

With Metro on port 8085, `adb reverse tcp:8085 tcp:8085`, one emulator, and the
development client installed:

```sh
MAESTRO_CLI=$HOME/.maestro/bin/maestro node .qa/qa-cold-signup.mjs
```

On hosts with several emulators attached, export `ANDROID_SERIAL=<serial>` to
pin every harness `adb` call and pass `--device` to Maestro; without it both
refuse to guess when more than one device is present.

The entry harness clears exactly `life.crays` during teardown and removes
`/tmp/qa-crays-entry.json`. Maestro screenshots remain available for diagnosis.

## Relay-backed scenarios

For any screen that reads or writes product data, bootstrap uses the deployed
coordinator and the reserved owner-scoped relay
`wss://crays-test.relays.nuts.cash`, preserving the production contract from
`/root/code/nuts-cash`. The coordinator defaults to
`https://coordinator.nuts.cash`; the stale local port 7798 is not part of QA.
Bootstrap lists the fixture admin's relays and reuses the exact
`crays-test.relays.nuts.cash` domain. It creates that reservation only when it
is genuinely absent, because the live coordinator enforces owner limits and a
creation cooldown.

Do not use a JavaScript mock store as proof of relay behavior. Keep fixtures
deterministic and make operations idempotent where the product requires it.
Addressable fixture `d` tags are stable and replace across runs; non-replaceable
awards are removed before each seed. Scenario state files contain the
re-fetched badge issuer secret, are always mode `0600`, and must never be
printed or committed.

The reserved relay persists, but fixture data does not. Bootstrap first grants
fixture identities a temporary, UI-invisible NIP-97 capability and sweeps old
events. Teardown publishes kind-5 deletions signed by each original fixture
author, verifies the tombstones landed, waits before checking absence, and
requires all non-kind-5 fixture events to be gone. Root-authored infrastructure
(the kind-31727 community anchor and kind-30009 `members` definition) is never
in the cleanup signer set. `node .qa/relay-teardown.mjs --sweep` recovers only
fixture data; it never deletes the relay or a Docker volume, and is safe only
when no other Crays QA run is active.

The switch-room scenario is the deliberate exception to the one-bootstrap
cleanup rule: the deployed coordinator currently limits this QA owner to the
reserved relay, so `.qa/qa-28-switch-room.mjs` seeds room A and then room B on
that same real relay with distinct room IDs and signed kind-30312 definitions. Its second
bootstrap sets `CRAYS_QA_PRESERVE_FIXTURES=1` to retain A while adding B; the
runner verifies A's left replacement before asserting that the app published
no B presence at the destination privacy screen. A non-owning instance of the
same Test Room bridge carries both room IDs during the device flow; stopping
that bridge never tears down the externally seeded A/B fixture family.

Relay-backed UI runs connect through a Test Room bridge on the first available
port from 8787, exposed to the Android emulator as `ws://10.0.2.2:<port>`. It
proxies WebSocket traffic to the reserved WSS relay, serves the exact NIP-11
document fetched and root-key-validated by bootstrap for that scenario, and
forwards invite-service calls when the scenario minted an invite. This
scenario-lifetime snapshot prevents a transient HTTP outage from erasing trust
while relay WebSocket traffic remains healthy. The manual development Test
Room connects directly to the reserved WSS relay unless proxy mode is
explicitly enabled. Independent verifiers always query the WSS relay directly.

The bridge also terminates NIP-42 for kind-4 reads. It verifies the app's
kind-22242 signature, exact challenge, local relay tag, timestamp, and
viewer-scoped filter before forwarding the query to the real relay. This is a
test-transport adapter, not an in-memory message store: events still come from
the reserved WSS relay and all message writes and verifier reads target that
relay directly. The adapter is presently necessary because the deployed
reserved relay challenges protected reads but rejects valid AUTH with its
routed `serviceUrl` unset. To pass the already-authenticated filter upstream,
the bridge adds a non-matching kind; remove this adapter once the deployed
relay advertises NIP-42 and accepts a direct signed AUTH probe.

Invite scenarios `qa-08-invite-preview.mjs` and
`qa-08b-invite-accepted.mjs` mint through the real relay invite service. The
accepted verifier queries the issued kind-8 award by exact invite nonce and
recipient and verifies its signature; rendered success text is never treated
as backend proof. `qa-09-returning-login.mjs` uses the development-only native
signer seed route. That route redirects in release builds and fixture secrets
must never be logged by app code or persisted in relay state outside isolated
QA.

Event access uses three separate lifecycle checks: `qa-20-room-event.mjs`
proves the live event and RSVP action, `qa-20b-tickets.mjs` proves that only a
relay-confirmed RSVP enters the durable RSVP archive, and
`qa-20c-ticket-detail.mjs` proves an issuer-signed kind-8 event entitlement can
produce a holder-signed 90-second kind-27236 presentation. The verifier decodes
the device payload and independently checks its signature, exact award, venue
relay, nonce, context, and window. An ordinary RSVP remains distinct from a
scanner entitlement.

`qa-19-membership-detail.mjs` and `qa-memberships.mjs` seed real membership and
three-use-pass definitions/awards plus one fulfilled use. They prove the list,
remaining-use derivation, activity, and live presentation. Pixels are not
backend proof; `verify-presentation.mjs` verifies the signed event.

Private messaging uses NIP-04 kind-4 events on the scenario's exact
badge-gated Nuts relay. `qa-messages-home.mjs` proves outbound encryption;
`qa-conversation.mjs` seeds an incoming encrypted event and proves receive,
acceptance, accepted reply, encrypted reply linkage, and venue report. Both
decrypt independently with fixture recipient keys and verify exact signatures
and minimal relay-visible tags. Production direct-message relays must protect
kind-4 reads with authentication because NIP-04 exposes participant metadata.

Safety paths use `qa-02-first-contact.mjs`, `qa-conversation-not-now.mjs`, and
`qa-safety-blocks.mjs`. They prove exact venue reports, no report/message side
effects for dismissal or block mutations, persistence, scope, filtering, and
unblock.

Primary navigation uses `qa-primary-tabs.mjs`. It proves that Room, Discover,
Messages, and Me are peer destinations in one tab navigator, that Room-local
state survives tab changes, and that a root-stack workflow covers the tab bar.
The scenario provisions the real relay contract and independently verifies the
signed room fixture and the app's relay-derived projections after UI exercise.

Join privacy uses separate identities. `qa-11-join-quiet.mjs` proves zero
presence writes; `qa-11-join-visible.mjs` proves exactly one signed visible
NIP-53 kind-10312 presence with selected intent, context, the exact authorized
kind-30312 room address, and expiry, plus the exact kind-0 profile used by
People and feed projections.

## Development and TestFlight Test Room

`npm run test-room` seeds the same real signed fixture family on the reserved
live relay and keeps a teardown owner alive until stopped. The app connects
directly to `wss://crays-test.relays.nuts.cash`; it is not a mock store. Visible
entry redeems the direct public invite and quiet entry does not. Use
`npm run test-room:stop` for author-scoped fixture cleanup. The reserved relay
itself remains running. `npm run test-room:publish` instead leaves the hosted
90-day fixture in place and writes ignored `.env.test-room-build` for the
TestFlight bundle. `npm run start:maestro` sources that file when present, and
`qa-27-discover-handoff.mjs` refuses to run without it (the flow asserts the
Developer/Test room section, which the bundle only renders with the token).

The local proxy is an explicit compatibility mode
(`CRAYS_TEST_ROOM_PROXY=1`) for development devices that cannot reach hosted
WSS directly. It fronts the hosted relay and invite-service routes without
becoming protocol authority. TestFlight and the direct Test Room QA scenario
call the hosted relay and invite service without this proxy.

The checkout scenario keeps the app's payment default pointed at
`https://payments.nuts.cash`. Its deterministic QA variant is an explicit
Metro-time override: start Metro with
`EXPO_PUBLIC_PAYMENT_SERVICE_URL=http://10.0.2.2:8790 npm run start:maestro`,
then run `node .qa/qa-14-review-pay.mjs`. The scenario starts
`.qa/checkout-adapter.mjs`, which validates the app's real kind-27235 checkout
request and calls the live room `/redeem` endpoint with the shared
`strfry-badge-node` payment-service key. It does not log that secret or use a
JavaScript mock award. The adapter is stopped in the scenario teardown.

The executable lifecycle is `.qa/qa-test-room.mjs` with
`maestro/flows/test-room.yaml`. It proves Discover card availability, direct
invite input through the synthetic Nearby pointer, visible selection, exact
membership-award read-back, fixture rendering,
joining-account kind-0 projection, room-bound kind-10312 presence, authorized
kind-30312 definition consumption, and exact fixture teardown while the reserved relay
remains available. Bootstrap rejects any invite response shorter than the
requested 90 days or smaller than the effectively unlimited redemption count.
The Test Room's root-signed membership definition grants kind `10312`. Room
identity is proven through NIP-11 root → root-signed kind-31727 anchor →
root/admin-authored NIP-53 kind-30312 definition.

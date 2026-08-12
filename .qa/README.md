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
`entry-router.md` is a warn-listed exception). Scenarios that harden an
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
- Logcat consumption verifiers (`verify-manifest-consumed`,
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
  and asserts the manifest error state renders instead of a hang. It
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

The invite-oriented relay screen scenarios connect through the Test Room bridge
at `ws://10.0.2.2:8787`. It proxies WebSocket traffic to the reserved WSS
relay, passes NIP-11 HTTP requests through to the deployed HTTPS origin, and
forwards invite-service calls. The manual development Test Room connects
directly to the reserved WSS relay instead. Independent verifiers always query
the WSS relay directly.

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
presence with selected intent, context, stable replacement key, and expiry.

## Long-running development Test Room

`npm run test-room` seeds the same real signed fixture family on the reserved
live relay and keeps it available until stopped. The manual-development Test
Room connects directly to `wss://crays-test.relays.nuts.cash`; it is not a mock
store and it does not redeem an invite. Use `npm run test-room:stop` for
author-scoped fixture cleanup. The reserved relay itself remains running.

The local proxy is an explicit compatibility mode (`CRAYS_TEST_ROOM_PROXY=1`)
for devices that cannot reach the hosted relay and remains enabled by the
invite-oriented relay screen scenarios, which need a local handoff endpoint.

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
`maestro/flows/test-room.yaml`. It proves Discover card availability, entry
through the synthetic Nearby result, quiet join, fixture rendering, manifest
consumption, signature validity, no invite redemption, zero presence writes,
and exact fixture teardown while the reserved relay remains available.

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
`.qa` lifecycle runner. This catches a newly added screen spec that has no
executable QA scaffold before device tests begin.

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

The entry harness clears exactly `life.crays` during teardown and removes
`/tmp/qa-crays-entry.json`. Maestro screenshots remain available for diagnosis.

## Relay-backed scenarios

For any screen that reads or writes product data, bootstrap must provision the
real coordinator/relay behavior described by `/root/code/nuts-cash`. A local
relay, proxy, signer, payment shim, or clock control is acceptable when it
preserves the production protocol boundary and the screen spec documents it.

Do not use a JavaScript mock store as proof of relay behavior. Keep fixtures
deterministic, make operations idempotent where the product requires it, and
use a Crays-specific unique prefix so the shared Nuts janitor cannot remove an
active scenario. `--sweep` is never safe while another QA run is live.

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

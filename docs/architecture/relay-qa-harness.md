# Relay-backed QA harness architecture

## Workflow boundary

Workflow: deterministic native application QA against isolated real Nostr relays.

Includes:

- provisioning isolated `strfry-badge-relay-node` instances through the real coordinator;
- seeding signed room, identity, catalog, event, invite, award, and status events;
- driving Crays through public routes and controls with Maestro;
- independently querying relay storage and live broadcasts after UI exercise;
- verifying signatures, authors, tags, replacement rules, idempotency, and forbidden side effects;
- deleting only the relays, volumes, helper processes, app state, and state files owned by the scenario.

Excludes production payment processors, public relays, fabricated in-app stores, and staff UI implementation.

Entry points are named `.qa/qa-<screen-or-workflow>.mjs` scenarios. Exit points are a passing independent verifier or a failing process with retained Maestro/debug artifacts followed by scoped teardown.

## Source evidence

This contract is extracted from `/root/code/nuts-rn/.qa` and `/root/code/nuts-cash/.qa`.
The stable pattern is:

```text
bootstrap real infrastructure
  -> write a scenario state file
  -> exercise public UI
  -> independently query protocol truth
  -> tear down exact infrastructure and device state
```

Important inherited behavior:

- the coordinator at `127.0.0.1:7798` provisions real isolated badge-gated strfry containers;
- coordinator and invite-service administration use fresh NIP-98 events;
- the coordinator can report `running` before the relay write gate is ready, so bootstrap retries a signed round-trip;
- Android reaches host loopback as `10.0.2.2`; invite-service/relay split ports require a websocket-aware proxy when one public origin is required;
- `kind 37237` is the durable, addressable status kind; readers may also accept legacy `27237` but writers publish `37237` only;
- UI success is never protocol proof: verification queries the relay independently and checks exact authors/tags;
- relay propagation is polled with a deadline rather than assumed immediate;
- scenario data uses unique run identifiers so reruns do not depend on old state;
- coordinator deletion does not remove `strfry-badge-data-<id>` volumes, so teardown owns both;
- the Nuts janitor deletes `qa-*` domains, therefore Crays domains use the collision-safe `craysqa-*` prefix.

## Architectural units

### Scenario runner

- Role: Coordinator.
- Responsibility: own bootstrap → exercise → verify → teardown in a `try/finally` lifecycle.
- Owns: scenario name, required fixture family, environment handed to Maestro, and verifier selection.
- Must not own: product truth or a second in-memory app backend.

### Relay provisioner

- Role: Service.
- Responsibility: create one or more isolated relays through the coordinator with NIP-98 authentication, wait for a signed round-trip, and expose host/emulator URLs.
- Owns: created relay IDs until teardown.
- Output: public fixture metadata and relay authority pubkeys.
- Must not persist admin or service secrets into scenario state.

### Fixture seeder

- Role: Service.
- Responsibility: publish deterministic, correctly signed Nostr fixtures and wait until each required event can be queried back.
- Fixture families: identity, discover, room, social, commerce, events, memberships, wallet-sync, and failure variants.
- Ownership rule: every fixture is namespaced by a unique run ID and signed by the authority expected in production.

### Scenario state repository

- Role: Repository.
- Responsibility: transfer public bootstrap outputs between scripts.
- Default path: `/tmp/qa-crays-<scenario>.json`.
- Contains: scenario/run IDs, relay IDs and URLs, public keys, event coordinates/IDs, invite token, expected values, proxy ports, helper PID paths.
- Forbidden: private keys, nsec values, Cashu proofs, or unrelated process IDs.

### Native UI exerciser

- Role: Worker.
- Responsibility: run one screen/workflow-specific Maestro flow against the development client.
- Inputs: public deep link or route context and fixture values from the state repository.
- Output: accessibility assertions, screenshots, and public-safe diagnostic markers.
- Must not call internal repositories or seed hidden app state to bypass the user path.

### Independent verifier

- Role: Service.
- Responsibility: query relay storage/live broadcasts with a separate `nostr-tools` pool and verify product invariants.
- Checks: event signature, exact kind, exact signer authority, subject/coordinate tags, replaceable-event winner, status transition ordering, expiry/revocation, idempotent count, and absence of forbidden writes.
- Must not accept rendered text or logcat alone as proof of relay behavior.

### Teardown owner

- Role: Coordinator.
- Responsibility: stop only recorded helper processes, delete only recorded coordinator relays, remove their named volumes, clear exactly `life.crays`, and remove exact scenario state files.
- Crash recovery: `--sweep` may target only `craysqa-*` relays and orphan volumes whose relay IDs are no longer live. It must never target `qa-*`, `rnqa-*`, or a broad workspace/system path.

## State model

```text
idle
  -> provisioning
  -> seeding
  -> ready
  -> exercising
  -> verifying
  -> passed | failed
  -> tearing_down
  -> disposed
```

The runner records infrastructure ownership immediately after each successful creation so a later failure still has enough state for teardown. Verification failure retains screenshots/logs but never retains relays unless an explicit diagnostic flag requests it.

## Data contracts

### Relay fixture

- `id`: coordinator relay ID.
- `name`: unique human-readable QA venue name.
- `domain`: `craysqa-<family>-<run>.test.local`.
- `hostRelayUrl`: coordinator-returned loopback websocket URL for Node verification.
- `deviceRelayUrl`: websocket URL rewritten to `10.0.2.2` or exposed through a recorded proxy.
- `serviceBaseUrl`: coordinator invite-service URL when needed.
- `authorityPubkeys`: admin, badge issuer, and any scenario users as public hex only.

### Seeded event reference

- `kind`, `id`, `pubkey`, `createdAt`.
- `coordinate` for addressable events.
- selected expected tags/content values needed by the verifier.
- no secret signing material.

### Verification result

- named invariant;
- matching event IDs/count;
- relay queried;
- pass/fail with a concise wire-level reason.

## Domain invariants

1. Product data is accepted only when its signature and expected authority relationship verify.
2. Exactly one room relay is active; search, identity/message, and wallet-sync infrastructure do not count as active rooms.
3. `30009:<issuer>:<d>` definitions and kind-8 awards remain the durable entitlement substrate.
4. Order/check-in state writes use addressable kind `37237` with both a stable `d` context and the legacy semantic context tag (`order` or `event`).
5. Status events count only when signed by relay/admin/badge authorities allowed by the venue trust contract.
6. A publish succeeds after at least one required relay accepts it; failed/absent acknowledgements remain visible and retryable.
7. Invite redemption is idempotent and account-bound; retry never burns or grants a second entitlement.
8. Presence, room feed, and proximity access stay venue-scoped and expire/lock; durable messages and entitlements remain.
9. Browse quietly creates no presence event.
10. Every live subscription has one stable result-set ID and is cleaned up when its owner exits.
11. A screen scenario proves its own primary action, failure/empty variants, relaunch boundary, and forbidden side effects. Cross-screen workflows are tested separately.

## Fixture families

| Family | Relay truth seeded | Screens/workflows |
| --- | --- | --- |
| `entry` | identity/profile only when a relay publish is required | 06, 06B, 07, 07B, 09 |
| `invite` | issuer profile, invite, `30009`, optional kind-8 prior award | 08, 08B, invite workflows |
| `discover` | signed expiring room highlights and direct manifests | 10, 27, 28, outage/forgery paths |
| `room` | venue profile/metadata, visible profiles, presence, announcements, posts | 01, 03, 10B, 11, 21 |
| `messaging` | sender/recipient profiles, request/contact state, block/report variants | 02, 22, Messages workflows |
| `commerce` | `30009` products, kind-8 orders, `37237` status history | 04, 12–15, 17, 23, 24 |
| `events` | `31922/31923`, `31925`, event-access `30009`, award/status | 05, 20 and ticket paths |
| `membership` | membership/pass `30009`, kind-8 award, `37237` uses | 05, 16, 18, 19 |
| `wallet` | encrypted wallet-sync fixtures and deterministic local mint/shim state | 25, 26 and recovery/conflict paths |

Unknown PRD event shapes—room discovery, presence, and room-feed expiration—must be isolated behind versioned Crays contracts and explicitly labelled pilot contracts. They may not masquerade as established NIPs.

## Per-screen scenario contract

Every built screen owns:

1. one default/ready scenario;
2. every decision branch that changes navigation or durable state;
3. loading, empty, offline, invalid/expired/revoked, retry, and permission-denied paths that apply;
4. repeat-tap/idempotency coverage for mutations;
5. background/relaunch recovery at each durable boundary;
6. independent relay verification for every read/write claim;
7. negative verification for privacy and single-room constraints;
8. exact teardown even when Maestro or verification fails.

Shared variants may be parameterized by one runner, but each screen/workflow keeps a named `.qa/qa-<name>.mjs` entry point and a screen-specific Maestro flow.

## Ordered implementation plan

1. Build shared coordinator/NIP-98, relay-pool, state-file, polling, proxy, and teardown utilities adapted to the Crays prefix and Android package.
2. Define versioned event contracts for unresolved Crays room concepts; reuse Nuts contracts unchanged for profiles, events, catalog, awards, presentations, and statuses.
3. Add fixture seeders by family with independent round-trip assertions.
4. Add public deep-link/entry-context handling so Maestro reaches a seeded relay through a real user path.
5. Implement screen-owned nipworker subscriptions with stable IDs and cleanup.
6. Implement mutations through the active signer and publish callbacks, considering success after any required relay accepts.
7. Add parameterized independent verifiers that query exact relay state and enforce negative invariants.
8. Wrap every Maestro flow in a named lifecycle runner with `try/finally` teardown.
9. Add multi-screen workflows only after constituent screen scenarios pass.
10. Run crash-recovery sweeps only when no Crays scenario is live.

## Acceptance checks

- A newly provisioned relay accepts and returns a signed authority profile before a scenario starts.
- The emulator connects only to device-reachable fixture URLs while Node verifies host URLs.
- Every relay-backed screen has at least one assertion based on independently queried events.
- Mutating flows prove exact event count, authority, tags, and idempotency after repeated taps/relaunch.
- Replaceable/addressable events resolve to the intended latest state.
- Privacy paths prove absence of presence, message, feed, or secondary-room writes.
- All subscriptions and helper processes terminate.
- Normal teardown removes exact relays, volumes, state, and `life.crays` data.
- `--sweep` cannot select Nuts-owned relay prefixes.

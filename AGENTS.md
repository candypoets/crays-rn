# Crays React Native agent guide

## Stack and startup

- The app is Expo 57 + React Native + Expo Router. Routes live in `src/app/`.
- NativeWind is the default styling layer. Use semantic utilities backed by
  `global.css` and `tailwind.config.js`; do not scatter brand hex values through
  screen components.
- Run native code in a development client, never Expo Go. nipworker is a native
  dependency and Expo Go cannot load it.
- Import the manager from `@candypoets/nipworker/react-native`. Use
  `@candypoets/nipworker/hooks` and `/utils` for subscriptions, publishing,
  narrowing, tag helpers, and FlatBuffer iteration.
- `src/nostr/manager.ts` owns the only app-wide manager. Do not create a manager
  in a screen.
- Do not add a generic API backend. Product data comes from venue/indexer Nostr
  relays; read `/root/code/nuts-cash` for the relay and coordinator contract.

## Entitlements (NIP-97)

The governing spec is **NIP-97 (draft)** at `/root/nips/97.md` — "Composable
Entitlements and Community Access Control". Pure helpers live in
`src/access/nip97.ts`; trust resolution in `src/rooms/trust.ts`.

- Kinds: community anchor `31727` (`d=community`, root-signed, admin `p` tags,
  `badge_issuer`), membership definitions `30009` (`t=membership`, optional
  NIP-99 `price` with recurrence in the 4th element, `permission` tags),
  products/passes/tickets `30402` (NIP-99 listings; a ticket links its event
  with `a`; `max_uses` defaults to 1), calendar events `31922/31923` (also
  their own free-admission definitions), awards `8` (with `t` query hints:
  definition kind plus finer topic), fulfillment `37237`.
- Trust chain: the room relay's NIP-11 `pubkey` is the community root key —
  the only out-of-band fact. The root-signed anchor declares admins and the
  delegated `badge_issuer`. Everything entitlement-related is resolved from
  the pinned community relay. Room metadata is a NIP-53 kind-30312 definition
  authored by the root or a current anchor admin.
- Issuance: anchor admins may award any definition; the `badge_issuer` may
  award sellable (well-formed `price` tag, zero price included) definitions
  only. Revocation is a kind `5` from the award issuer or an anchor admin.
- Status signers are checked as admins ∪ `badge_issuer`; the strfry write
  gate additionally enforces `37237`-write role holders relay-side, so events
  read back from the pinned relay already passed the full rule.
- Trust is enforced in the pure derivations (`deriveEntitlements`,
  `liveOrders`), not in the FlatBuffer ingest callbacks; events arriving
  before the anchor resolves are buffered and filtered at derive time.

## Screen delivery contract

Every screen change must include all of the following in the same change:

1. A detailed product/interaction spec under `docs/screens/` covering entry,
   states, navigation, accessibility, failures, and Nostr/relay behavior.
2. Deterministic Jest/RNTL coverage for every applicable ready, loading, empty,
   error, retry, disabled, and interaction state. Prefer a table-driven state
   matrix and semantic accessibility queries.
3. Pure-logic tests for trust, projection, ordering, event construction, and
   other protocol decisions outside the component.

Do not add a Maestro flow or `.qa` entry point merely because a screen changed.
Add or extend a registered device journey only when the behavior crosses a
boundary Jest cannot prove: native navigation/deep links, OS permissions,
SecureStore/process persistence, native nipworker integration, or actual relay
reads/writes. One journey may cover several screens.

Device journeys live in `.qa/scenario-registry.mjs` and run through
`.qa/run-scenario.mjs`. Relay-backed journeys must provision the real
relay/coordinator contract from `nuts-cash` and query it independently after UI
exercise; UI assertions or an in-memory JavaScript store are never proof of
protocol success.

Shared Maestro startup lives in `maestro/flows/launch.yaml`. Start Metro with
`npm run start:maestro` (it sources `.env.test-room-build` when present, so the
Test Room token reaches the bundle), run `adb reverse tcp:8085 tcp:8085`, and
then run the selected journey. Port 8085 intentionally avoids the `nuts-rn` Metro
process on 8084. Do not set `CI=1` for Metro; the dev-client launcher discovery
and bundle freshness are unreliable in that mode on this host.

## QA harness conventions

- Positive relay verifiers must poll with `queryUntil` from
  `.qa/relay-lib.mjs` (~15s) instead of a single `querySync`; negative
  (absence) verifiers must call `settleBeforeAbsence` first so a lagging
  write cannot fake a pass.
- Strings typed by Maestro flows and asserted by verifiers live in
  `.qa/flow-fixtures.mjs`. Relay-backed flows receive them as `QA_*` env vars
  from `relay-screen-scenario.mjs`; bootstrap fixtures use the same module as
  their source of truth. Never hard-code these strings in a verifier.
- Logcat `__DEV__` markers are a complement to independent relay queries,
  never a replacement for them.
- `npm run qa:contracts` checks every screen spec's mapped deterministic Jest
  coverage plus every registered journey's ownership, flow, verifier/custom
  executor, and transitive `launch.yaml` inclusion.
- Run `npm run qa:list` to discover journeys and
  `npm run qa:journey -- <name>` to execute exactly one isolated lifecycle.


## nipworker rules

- Preserve FlatBuffer views and read only fields the UI needs. Do not unpack or
  mirror every event into plain-object DTOs.
- Narrow a worker message before reading kind-specific fields. Use `fbIterable`
  or `fbArray` for vectors and the library tag-extraction helpers for tags.
- A stable `subId` identifies one result set and enables dedupe. Concurrent live
  filters require separate subscription IDs because relays replace a REQ that
  reuses an ID.
- A publish is successful after any required relay returns a true status; do
  not keep a screen loading while waiting for every relay.
- Unsubscribe when the owning screen or component unmounts.
- Shared stores may hold stable app inputs, but must not mirror a screen's
  subscription buffer or publish result.

## Working tree safety

The PRD and screen assets predate the scaffold and may contain user changes.
Do not rewrite or delete them while implementing a screen.

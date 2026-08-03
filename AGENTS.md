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

## Screen delivery contract

Every screen change must include all of the following in the same change:

1. A detailed product/interaction spec under `docs/screens/` covering entry,
   states, navigation, accessibility, failures, and Nostr/relay behavior.
2. Component or pure-logic tests for deterministic states and edge cases.
3. A screen-specific Maestro flow under `maestro/flows/`.
4. A named `.qa/` scenario that owns bootstrap, the Maestro exercise, any
   independent verification, and teardown. This applies to every screen and
   workflow, including local-only or deliberately no-relay states.
5. For relay-backed behavior, provision the real relay/coordinator contract
   from `nuts-cash` and query it independently after UI exercise; UI assertions
   or an in-memory JavaScript store are never proof of protocol success.

Shared Maestro startup lives in `maestro/flows/launch.yaml`. Start Metro with
`npm run start:maestro`, run `adb reverse tcp:8085 tcp:8085`, and then run the
screen flow. Port 8085 intentionally avoids the `nuts-rn` Metro process on
8084. Do not set `CI=1` for Metro; the dev-client launcher discovery and
bundle freshness are unreliable in that mode on this host.

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

# 00 — Application foundation

## Product requirement

This infrastructure milestone is retained as a startup regression note. Its
temporary route has been replaced by the entry router and cold-welcome screen.

The route must prove that:

- Expo Router owns app startup and resolves `/`;
- the screen respects safe areas on Android and iOS;
- NativeWind resolves the inherited semantic Crays color tokens;
- muted text, placeholders, and errors retain AA contrast on both white and
  pale-lilac surfaces;
- startup uses the approved Night Playlist pale-lilac canvas, deep-plum/yellow
  C mark and wordmark, and a labelled one-shot tempo rail rather than the
  incumbent dark theme;
- the Crays development client contains nipworker's native module;
- one app-wide nipworker manager is created before any feature subscribes;
- a native integration failure is rendered as an explicit state, never a
  blank screen;
- no default public relay is contacted before a feature owns a justified relay
  set.

The current startup surface is Screen 06. `FoundationScreen` is no longer a
routed screen; the root layout's `RuntimeGate` renders it when the native
Nostr engine reports `unavailable` or `error`, so an integration failure
surfaces as this explicit state instead of a blank app. When the engine is
`ready` the gate renders the normal provider tree and entry router.

## Nostr and relay behavior

`src/nostr/manager.ts` owns the sole app-wide manager. React Native code imports
the manager from `@candypoets/nipworker/react-native`; importing the browser
entry point here is a defect. The manager starts with empty default/indexer
relay arrays because Crays room relays come from verified room descriptors and
future account/index subscriptions need their own documented relay policy.

Feature subscriptions must keep FlatBuffer views alive, narrow worker messages
before field access, and clean up their subscription when the owning screen
unmounts. A result set gets one stable `subId`; concurrent filters get distinct
IDs because a relay replaces a live REQ that reuses the same ID.

## QA strategy

### Automated component coverage

`FoundationScreen.test.tsx` verifies the Night Playlist product promise, accessible heading,
successful engine state, and explicit missing-engine state. This test does not
pretend to load the native TurboModule under Jest. It separately covers both
native-module unavailability and initialization errors.

`NightPrimitives.test.tsx` separately verifies that square venue cells and tall
portrait cells are cropped with uniform geometry instead of stretched, and
that the decorative tempo rail and clipped edge tabs stay out of the
accessibility tree.

### On-device acceptance

`maestro/flows/00-foundation.yaml` is now a lightweight startup smoke test and
asserts:

1. Expo Router reaches the root route.
2. The cold-welcome screen is present in the accessibility tree.
3. The approved **Your night starts here** promise and **Tonight moves.** cue render.
4. No native-runtime failure state renders.

The stronger native proof lives in `scenario:cold-signup`: it creates a
device identity, signs a kind-0 profile event, independently verifies that
signature, and proves that onboarding opened no relay connection or
subscription. This exercises the linked native stack through the actual entry
workflow rather than relying on a diagnostic label.

The foundation flow has no relay fixture because this screen intentionally
opens no relay connection. The first relay-backed screen must add a `.qa/`
scenario that provisions the real relay behavior from `nuts-cash`, a Maestro
flow for UI behavior, and a post-flow verifier for the resulting Nostr events.

### Manual checks

- Verify the status-bar content does not cover the heading on Android.
- Switch the system between light and dark mode; the pale-lilac Night Playlist
  surface remains intentional and readable in both modes.
- Launch in Expo Go once and confirm the failure state is visible. Expo Go is
  not a supported execution target.

## Exit criteria

- `npm run typecheck`, `npm run lint`, and `npm test` pass.
- `npm run prebuild -- --platform android --no-install` generates an Android
  project containing the nipworker Maven repository.
- The Android development client builds and the cold-signup `.qa` lifecycle
  passes.

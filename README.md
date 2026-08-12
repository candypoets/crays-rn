# Crays Mobile

React Native client for the place-first Crays experience described in
`PRD.md`. The app uses Expo Router, NativeWind, and nipworker's native React
Native runtime.

Unresolved protocol, service, payment, custody, and cross-platform decisions
are tracked in [`docs/DESIGN-DEBT.md`](docs/DESIGN-DEBT.md). Disabled states are
deliberate when a production contract would be unsafe to emulate.

## Prerequisites

- Node.js 22.13 or newer
- Android SDK/NDK or Xcode/CocoaPods for the target platform
- Maestro for on-device acceptance tests

Expo Go is not supported because nipworker includes native Android and iOS
code.

## Install and run

```sh
npm install
npm run android
```

`expo run:android`/`expo run:ios` generates the native project when needed. The
local Expo config plugin adds nipworker's Maven repository on Android and pins
the matching FlatBuffers Swift runtime on iOS, including after clean prebuilds.

To run the iOS development client in a simulator:

```sh
npm run ios
```

For a physical iPhone, select your Apple development team for the `Crays`
target in Xcode, then run `npm run ios -- --device`. Expo Go is not supported.

For the known-good headless Android + Maestro loop used by `nuts-rn`:

```sh
npm run start:maestro
adb reverse tcp:8085 tcp:8085
MAESTRO_CLI_NO_ANALYTICS=1 maestro test maestro/flows/cold-signup.yaml
```

Start Metro without `CI=1`. The shared launch flow clears development-client
state, connects to `exp://localhost:8085`, dismisses optional development UI,
and waits up to three minutes for a cold bundle.

## Development Test Room

For a teardown-owned room during local development, keep this in a second
terminal:

```sh
npm run test-room
```

Discover will show **Crays Test Room** after the pinned relay's NIP-11 document
establishes its root, the root-signed kind-31727 anchor establishes the current
admin set, and an authorized NIP-53 kind-30312 room definition resolves. The
definition's exact `30312:<author>:<d>` address is retained for later
kind-10312 presence. The direct invite is verified through that trust path,
the returned award, and the pinned relay. The card simulates a version-2
Nearby result with the hosted service and direct broadcast invite. Quiet entry
never redeems it; visible entry confirms the exact relay award before
publishing presence. Bluetooth is not involved. The command uses the live
reserved Nuts relay, seeds the signed fixture, and removes its fixture events
when stopped. Stop it with Ctrl-C or
`npm run test-room:stop`.

For a TestFlight build, publish the 90-day fixture and public, effectively
unlimited invite once:

```sh
npm run test-room:publish
```

This writes ignored `.env.test-room-build`. Export those `EXPO_PUBLIC_*`
values into the TestFlight bundle process. The installed app talks directly to
the hosted relay and invite service; no developer-host proxy is required.
`npm run start:maestro` sources the same file automatically when present, so
the local dev/QA bundle gets the token without a manual export.

The Android emulator, iOS simulator, and physical devices use the hosted relay
with the defaults. If a device cannot reach it, opt into the local compatibility
proxy:

```sh
CRAYS_TEST_ROOM_PROXY=1 npm run test-room
EXPO_PUBLIC_CRAYS_TEST_RELAY_URL=ws://192.168.1.20:8787 npm run start
```

The card and its relay subscription exist in development builds and explicit
test builds (`EXPO_PUBLIC_CRAYS_TEST_BUILD=1`), never ordinary releases.

Self-orders with one menu item at quantity one can continue to the shared Nuts
hosted Stripe checkout. The payment service re-reads the signed room listing,
and Crays shows the order only after the room relay returns the signed product
award. Gift, Cashu, multi-line, and multi-quantity checkout remain disabled
until their payment contracts are implemented.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run doctor
```

Screen requirements and their QA strategy live together in `docs/screens/`;
cross-screen contracts live in `docs/workflows/`. Every screen has a named
`.qa` scenario, including local-only screens.

Run the complete local cold-signup scenario after Metro and the emulator are
ready:

```sh
export MAESTRO_CLI="$HOME/.maestro/bin/maestro"
npm run qa:entry
```

This bootstraps clean Android/log state, drives Screens 06 → 06B → 07 → 07B
through public UI, verifies the signed kind-0 independently, proves onboarding
opened no relay/subscription, and clears only the `life.crays` package during
teardown. Relay-backed QA conventions are documented in `.qa/README.md`.

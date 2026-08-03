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

For a room that is always discoverable during local development, keep this in
a second terminal while the Nuts coordinator is running on port 7798:

```sh
npm run test-room
```

Discover will show **Crays Test Room** after its signed manifest arrives. Open
it and choose quiet entry; Bluetooth range is not involved. The command uses a
real isolated Nuts relay and removes it when stopped. Stop it with Ctrl-C or
`npm run test-room:stop`.

The Android emulator and iOS simulator work with the defaults. For a physical
device, start Metro with a LAN-reachable host address:

```sh
EXPO_PUBLIC_CRAYS_TEST_RELAY_URL=ws://192.168.1.20:8787 npm run start
```

The card and its relay subscription exist only in development builds.

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

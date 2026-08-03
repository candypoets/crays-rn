# Workflow — Manual development Test Room

## Product contract

Development builds show one fixed **Crays Test Room** card on Discover. The
card is a developer affordance, not a production Map result: it is compiled
out when `__DEV__` is false and it becomes actionable only after the app has
consumed a fresh, operator-signed `life.crays/room/v1` manifest from the local
relay.

The room is reachable without Bluetooth range. Opening it goes through Room
preview and Join privacy directly; only the explicit Nearby discovery channel
may request Bluetooth permission. A normal developer identity should choose
quiet entry because the Nuts fixture relay permits reads but gates visible
writes on its membership badge.

Run `npm run test-room` while developing. The command provisions an isolated
real Nuts relay, publishes the complete signed fixture family, and exposes it
through a stable WebSocket transport on port 8787. It remains alive until the
command receives SIGINT/SIGTERM, then deletes exactly its relay and Docker
volume. `npm run test-room:stop` safely signals the recorded process.

Android emulators use `ws://10.0.2.2:8787`; iOS simulators use
`ws://127.0.0.1:8787`. A physical device requires
`EXPO_PUBLIC_CRAYS_TEST_RELAY_URL=ws://<development-host-LAN-IP>:8787` before
Metro starts.

## QA strategy

`.qa/qa-test-room.mjs` provisions the real relay and stable proxy, seeds a
development-only signer identity, and drives `maestro/flows/test-room.yaml`
through Discover → Test Room → preview → quiet join → People. The flow asserts
that Bluetooth rationale never appears and that signed fixture people render.

Independent verification then queries the underlying relay, verifies every
fixture signature and fresh manifest, checks the app's consumed manifest log,
and proves quiet entry published no presence. Teardown is scoped to the exact
state/PID files and created relay.

Additional required paths: relay offline card and recovery command; relay
restart with a changed underlying port; closed or expired manifest disables
entry; visible join explains membership-gated failure; physical-device LAN
address; release build contains no Test Room subscription or card.

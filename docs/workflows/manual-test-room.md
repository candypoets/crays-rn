# Workflow — Manual development Test Room

## Product contract

Development builds show one fixed **Crays Test Room** card on Discover. The
card is a developer affordance, not a production Map result: it is compiled
out when `__DEV__` is false and it becomes actionable only after the app has
consumed a fresh, operator-signed `life.crays/room/v1` manifest from the
reserved live relay.

The card is the synthetic Nearby result for the development client. It uses
the same verified room-pointer outcome as a nearby gateway—room id plus relay
URL—but does not request Bluetooth permission and does not carry an invite
token. Opening it goes through Room preview and Join privacy directly. Quiet
entry persists the selected room and starts its live subscriptions without
redeeming an invite or publishing presence. A normal developer identity should
choose quiet entry because the Nuts fixture relay permits reads but gates
visible writes on its membership badge.

Run `npm run test-room` while developing. The command provisions the reserved
live Nuts relay, publishes the complete signed fixture family, and keeps the
fixture alive while the app connects directly to its hosted WSS URL. It remains
alive until the command receives SIGINT/SIGTERM, then removes exactly the
fixture-authored events. It does not mint or redeem an invite for Test Room
entry; invite minting remains owned by the separate invite QA scenarios.
`npm run test-room:stop` safely signals the recorded process.

If a device cannot reach the hosted relay, opt into the compatibility proxy
with `CRAYS_TEST_ROOM_PROXY=1 npm run test-room`, then start Metro with
`EXPO_PUBLIC_CRAYS_TEST_RELAY_URL=ws://<development-host-LAN-IP>:8787`.

## QA strategy

`.qa/qa-test-room.mjs` provisions the real relay, seeds a development-only
signer identity, and drives `maestro/flows/test-room.yaml` through Discover →
Test Room (synthetic Nearby) → preview → quiet join → People. The flow asserts
that Bluetooth rationale never appears, invite redemption does not occur, and
signed fixture people render.

Independent verification then queries the underlying relay, verifies every
fixture signature and fresh manifest, checks the app's consumed manifest log,
proves that no invite token or required-membership award was created for the
app identity, and proves quiet entry published no presence. Teardown is scoped
to the exact state/PID files and reserved relay fixture events.

Additional required paths: relay offline card and recovery command; relay
restart with a changed underlying port; closed or expired manifest disables
entry; visible join explains membership-gated failure; physical-device LAN
address; release build contains no Test Room subscription or card.

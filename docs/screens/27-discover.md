# Screen 27 — Discover rooms

## Product contract

Purpose: choose one verified room relay without implying attendance, popularity,
or exact distance. Discover is the pre-selection home and must remain useful
when Bluetooth is denied or the search relay is offline.

Entry points: completed onboarding, Room tab with no active room, explicit
Discover tab, direct room link/QR, or a preserved authentication intent.

Primary action: open a room preview. Secondary actions: switch Map/Nearby and
learn why Nearby permission is useful. Neither action joins a room.

## Data and state

- A direct result subscribes to kind `30078`, optionally filtered by
  `d=life.crays/room/v1/<room-id>`, on the supplied search/direct relay.
- The screen copies only the verified room selector fields required to cross
  into navigation: id, name, relay, operator, expiry and capabilities.
- Verification requires schema v1, unexpired timestamp, signer=operator, and a
  relay URL. Failure never produces a room card or Verified label.
- Map and Nearby resolve to the same `RoomDescriptor`; Nearby is a discovery
  channel, not a second room record.

States: loading signature; verified result; empty Map; Nearby off; stale or
forged result; relay timeout; several results (list/cluster extension); search
outage with direct-link fallback. Cold signup retains the account-ready and
no-premature-permission consequence.

Because D-001 has no production query contract, the default Map renders its
search/category shell disabled with **Map and search are not configured**. It
does not ship a fake place list or pretend retry can reach a nonexistent
service. Direct relay links and GATT manifests continue through the implemented
signature validator.

Development builds also render a fixed **Crays Test Room** card. It subscribes
to the real local signed relay fixture at the platform-specific port-8787
address and remains disabled with an exact recovery command while that relay is
offline. This card and subscription are absent from release builds; they are
not a substitute for D-001 or a fabricated production listing. When a direct
link already targets the test room's relay and id, the duplicate card and its
subscription are suppressed because relays replace a REQ that reuses a
subscription ID.

Accessibility: Map/Nearby are real tabs with selected state; room cards have a
single descriptive action; verification is text plus icon; 48dp targets and
large-text wrapping are required.

## QA strategy

Unit coverage verifies empty Map, Nearby rationale, fresh verified result, and
failure without fabricated content. Maestro opens a real per-run relay result,
switches both tabs, and captures the native screen. `.qa/qa-27-discover.mjs`
owns a fresh gated relay, issuer-authorized people, full fixture family,
Maestro, independent signature/query verification, app-consumption log proof,
relay deletion and Docker-volume deletion.

Required paths: cold account → empty Map; development Test Room online →
preview → quiet join without Bluetooth; Test Room offline → disabled recovery
copy; release build → no Test Room; Nearby → rationale; direct fresh
manifest → preview; stale/wrong signer → no card; relay unavailable → retry
copy while Messages/Me remain; relaunch of direct link; repeated tap does not
change active room; no permissions before rationale.

Pass criteria: the displayed id/operator/relay equal the signed event queried
independently, exactly zero room selection/presence mutations occur, and
teardown leaves no `craysqa-*` relay or state file for the run.

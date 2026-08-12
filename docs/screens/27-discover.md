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

States: loading signature; verified result; empty Map (reachable only with a
search/direct relay); Nearby off (the newcomer default); stale or
forged result; relay timeout; several results (list/cluster extension); search
outage with direct-link fallback. Cold signup retains the account-ready and
no-premature-permission consequence, phrased for a newcomer ("No Bluetooth or
location permission asked — Nearby only uses them if you turn it on"). A
newcomer without a room link lands on Nearby with Map disabled; a direct link
selects Map with its verified result.

Because D-001 has no production query contract, Map is never presented as an
available choice: with no search/direct relay the Map tab renders disabled and
unselectable, the screen never rests on Map, and a subordinate note below the
empty state reads **Map search isn't available yet** with the truthful next
actions (a signed room link from the venue, or Nearby). It does not ship a
fake place list or pretend retry can reach a nonexistent service, and it does
not size or style the note as an error. The internal diagnostic
`Search service design pending · D-001` lives only inside the Developer
section, which itself renders in development builds only. Direct relay links
and GATT manifests continue through the implemented signature validator.

Development builds also render a compact **Developer** section at the bottom
of the screen, visually subordinate to every newcomer state. It exposes the
reserved live signed relay fixture at `wss://crays-test.relays.nuts.cash` as
one **Test room** row: room name when the fixture is online, `Connecting…`
while waiting, and `Offline — run npm run test-room` with the Open action
disabled while the fixture is down. This row is a synthetic Nearby result for
the development client: it follows the room-pointer path without requesting
Bluetooth permission and without carrying or redeeming an invite. Internal
labels ("Development test mode", "local signed test relay", "Waiting for test
relay") never appear on the newcomer surface. This section and its
subscription are absent from release builds; they are not a substitute for
D-001 or a fabricated production listing. When a direct link already targets
the test room's relay and id, the duplicate card and its subscription are
suppressed because relays replace a REQ that reuses a subscription ID.

Accessibility: Map/Nearby are real tabs with selected and disabled states;
room cards have a single descriptive action; verification is text plus icon;
48dp targets and large-text wrapping are required.

## QA strategy

Unit coverage verifies the newcomer default, the disabled-Map contract, Nearby
rationale, fresh verified result, and failure without fabricated content. The
relay-backed `maestro/flows/27-discover.yaml` opens a real per-run relay result,
switches both tabs, and captures the native screen; `.qa/qa-27-discover.mjs`
owns its fresh gated relay, issuer-authorized people, full fixture family,
independent signature/query verification, app-consumption log proof, relay
deletion, and Docker-volume deletion. The additional local-only newcomer path
is `maestro/flows/27-discover-handoff.yaml`, owned by
`.qa/qa-27-discover-handoff.mjs`; it proves onboarding creates one valid local
identity and no relay connection or subscription before exercising Nearby's
rationale and the honest disabled-Map state.

Required paths: cold account → newcomer Nearby with Map disabled; development
Test Room online → synthetic Nearby result → preview → quiet join without
Bluetooth or invite redemption; Test Room offline → disabled recovery copy;
release build → no Test Room; Nearby → rationale; direct fresh manifest →
preview; stale/wrong signer → no card; relay unavailable → retry copy while
Messages/Me remain; relaunch of direct link; repeated tap does not change
active room; no permissions before rationale.

Pass criteria: the displayed id/operator/relay equal the signed event queried
independently, exactly zero room selection/presence mutations occur, and
teardown leaves no `craysqa-*` relay or state file for the run.

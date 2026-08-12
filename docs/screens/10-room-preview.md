# Screen 10 — Room preview

## Product contract

Canonical visual reference: `docs/design-explorations/night-playlist/mockups/05-discovery-and-access-v1.png`, panel 03. This is the one intentionally immersive Night Playlist frame: full-bleed venue atmosphere under readable dark overlay, with signed identity and actions kept together.

Purpose: let a person inspect the venue identity, current utility and entry
consequence before Bluetooth or presence. It is shared by Map, Nearby, QR,
link, event and invite entry.

The signed room name and Verified label are primary. The signed description
and capabilities explain why entry is useful; the manifest carries no event
title or schedule, so the preview renders none rather than fabricating one.
**Enter room** advances directly to Join privacy for Map, QR and direct-link
entry. It does not request Bluetooth
or publish presence. Nearby discovery owns its just-in-time permission
rationale before scanning. Back/cancel returns to the preserved discovery
context.

**Preview room** expands a pale signed-capabilities section in place. That section reads only the already-validated descriptor and explicitly states that no live-feed subscription or presence publish occurs. **Enter room** is a separate coral commitment and stays disabled when the signed room is closed. The hero never invents an event title, start time, or capability absent from the manifest.

Closed rooms keep durable event/menu information readable but disable entry.
Missing, stale, unsupported-schema, signer-mismatch and relay-timeout states
show “Room could not be verified” and route safely to Discover.

## Data contract

The screen uses the same stable subscription key and manifest validator as
Discover. It never trusts query parameters for display identity: relay and
room parameters only build the filter; fields come from the signed manifest.
No room-scoped feed, people, menu or presence subscription starts here.

## QA strategy

Unit tests cover fresh/open, closed/disabled, and unverified failure. Native
Maestro opens the preview from a direct URL against a fresh real relay and
asserts identity, verification, utility and CTA. `.qa/qa-10-room-preview.mjs`
independently proves the app consumed the operator/relay/id from the same
valid signed manifest, then destroys the relay and its volume.

Required additional paths for implementation: direct/Map/QR open → Join
privacy with no Bluetooth prompt; Nearby scan → rationale before preview; Not
now → original context; closed; expired between Discover and preview; relay drops
after cached verification; unknown capability ignored; text scaling; offline
cached ticket remains reachable but no fresh Verified claim is invented.

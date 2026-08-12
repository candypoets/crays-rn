# 01 — People in the room

## Product contract

Canonical visual reference: `docs/design-explorations/night-playlist/mockups/01-room-and-feed-v1.png`, panel 02. This Night Playlist board supersedes the incumbent dark room PNGs for composition and color while the relay contract below remains authoritative.

People is the default destination after a successful room join. It proves that exactly one venue relay is active, shows only opted-in visible presence, and never exposes distance, popularity, or hidden attendance. Quiet visitors retain full read, ordering, ticket, and membership access without appearing in this roster.

Entry requires a persisted `ActiveRoom`. With no active room, route to Discover. The header uses the signed manifest name and the fixed state **Connected in the room**; it must not infer venue identity from profiles or local copy.

## UI and interaction

- Header: signed room name, compact connection state, native Leave control, Menu, My night, and the local **Right now / Feed** switch.
- Current-moment rail: joined time, selected room descriptor, and credential expiry. Its schedule-like form follows the mockup without inventing venue event data.
- Roster: horizontally readable portrait cards with display name and intent in deterministic accessible order. Optional context is included in each card's accessible label. No per-person "online" dot is rendered; roster membership is the only presence signal and it is already textual.
- Portrait cards use the Night Playlist portrait atlas with its native tall-cell
  aspect ratio, retain at least 48-point targets, and end in a uniformly cropped
  venue image without changing semantic order or distorting either atlas.
- The visible count counts current, non-expired, explicitly visible presence projections only.
- Tapping a person opens screen 02 with their relay-derived public key; no name is used as identity.

## State and relay contract

`RoomSessionProvider` owns only the durable active-room selection. `RoomDataProvider` owns the live projection and subscribes with stable ID `room_data_<room id>` to the one device transport URL.

Relevant events:

- kind 78, `schema=life.crays/presence/v1`, `type=presence`, `h=<room id>`;
- kind 0 profiles from the same relay;
- latest presence and latest profile win by `created_at`;
- `visibility=visible`, no `status=left`, and future `expiration` are all required;
- missing profiles do not produce fabricated roster entries.

The versioned kind-78 format is a Crays pilot contract, not a standardized NIP. FlatBuffer views are validated in the subscription callback and reduced to the smallest stable UI projection.

## Required states

- connecting: room chrome remains stable and states that the relay is connecting;
- populated: current visible profiles and exact count;
- quiet empty: explains that only opted-in visible people appear;
- visible empty: states that no visible profiles arrived yet;
- stale/left/quiet presence: excluded;
- expired room credential: transition to screen 21, never keep a stale roster interactive;
- relay failure: keep the selected room and offer retry/leave without inventing offline people.

## Accessibility and privacy

Name, intent, and context are text and may reflow under large type instead of
being clipped. Reading order is predictable despite the organic visual layout.
The current-moment summary announces joined, current, and expiry values as one
coherent unit. No exact distance, table number, follower count,
profile-open count, or non-room activity is rendered. Quiet mode is never
visually treated as degraded access.

## QA strategy

Unit coverage in `RoomScreen.test.tsx` verifies populated and quiet-empty paths,
person identity routing, and the accessible current-moment summary.
`NightPrimitives.test.tsx` verifies portrait and venue crop geometry. Native
workflow `maestro/flows/01-people.yaml` enters quietly through the real join
screen, waits for live relay projections, checks the exact visible-only count,
and captures the canonical state.

`.qa/qa-01-people.mjs` owns an independent lifecycle:

1. create an isolated Nuts coordinator relay and record its exact relay/volume IDs;
2. issue fixture membership awards through the same gate as production;
3. publish signed manifest, profiles, visible presences, feed, catalog, membership, and event fixtures;
4. enter the room on Android using the emulator transport alias;
5. assert the screen consumed profile and presence FlatBuffers;
6. independently query every fixture and verify all Nostr signatures;
7. delete the exact relay and Docker volume in `finally`.

Additional implementation QA must cover: zero profiles, profile without presence, quiet presence, left tombstone, expired presence, newer/older replacement ordering, malformed profile, wrong room `h`, reconnect, background/foreground, and switching to a second relay without mixed roster data.

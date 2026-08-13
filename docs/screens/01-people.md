# 01 — People in the room

## Product contract

Canonical visual reference: `docs/design-explorations/night-playlist/mockups/01-room-and-feed-v1.png`, panel 02. This Night Playlist board supersedes the incumbent dark room PNGs for composition and color while the relay contract below remains authoritative.

People is the default destination after a successful room join. It proves that exactly one venue relay is active, shows only opted-in visible presence, and never exposes distance, popularity, or hidden attendance. Quiet visitors retain full read, ordering, ticket, and membership access without appearing in this roster.

Entry requires a persisted `ActiveRoom`. With no active room, route to Discover. The header uses the root-authorized NIP-53 room-definition name and the fixed state **Connected in the room**; it must not infer venue identity from profiles or local copy.

## UI and interaction

- Header: signed room name, compact connection state, native Leave control, Menu, My night, and the local **Right now / Feed** switch.
- Room-session rail: joined time and credential expiry only. A kind-30312 room description is identity metadata, not a calendar event, so it is never placed in a **Right now**, event, or schedule slot. Venue events remain absent from this surface unless a future design consumes a trusted kind-31922/31923 projection explicitly.
- Roster: horizontally readable portrait cards with display name and intent in deterministic accessible order. Optional context is included in each card's accessible label. No per-person "online" dot is rendered; roster membership is the only presence signal and it is already textual.
- Portrait cards use the Night Playlist portrait treatment with its native
  tall-cell aspect ratio and retain at least 48-point targets. No bundled venue
  photograph appears as current room or event evidence; this screen has no
  trusted event-image input.
- The visible count counts current, non-expired, explicitly visible presence projections only.
- Tapping a person opens screen 02 with their relay-derived public key; no name is used as identity.

## State and relay contract

`RoomSessionProvider` owns only the durable active-room selection. `RoomDataProvider` owns the live projection and gives each concurrent event family a stable room-scoped subscription ID on the one device transport URL.

Relevant events:

- NIP-53 kind `10312` with the exact `a=30312:<authorized-author>:<room-d>`;
- kind 0 profiles from the same relay;
- latest presence and latest profile win by `created_at`, then the NIP-01
  lowest-id tie-break;
- the presence event is the opt-in; `status=left`, an elapsed NIP-40 expiry,
  or a stale five-minute fallback window excludes it;
- missing profiles do not produce fabricated roster entries.

Presence is refreshed every 60 seconds and on foreground without extending the fixed automatic-leave time. FlatBuffer views are validated in the subscription callback and reduced to the smallest stable UI projection.

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
The room-session summary announces joined and expiry values as one coherent
unit. No exact distance, table number, follower count,
profile-open count, or non-room activity is rendered. Quiet mode is never
visually treated as degraded access.

## QA strategy

Unit coverage in `RoomScreen.test.tsx` verifies populated and quiet-empty paths,
person identity routing, the accessible room-session summary, and the absence
of the kind-30312 description from event-like UI.
`NightPrimitives.test.tsx` verifies portrait and venue crop geometry. Native
workflow `maestro/flows/01-people.yaml` enters quietly through the real join
screen, waits for live relay projections, checks the exact visible-only count,
and captures the canonical state.

`.qa/qa-01-people.mjs` owns an independent lifecycle:

1. create an isolated Nuts coordinator relay and record its exact relay/volume IDs;
2. issue fixture membership awards through the same gate as production;
3. publish the root/admin-authored kind-30312 room definition plus signed profiles, room-bound NIP-53 presences, feed, catalog, membership, and event fixtures;
4. enter the room on Android using the emulator transport alias;
5. assert the screen consumed profile and presence FlatBuffers and did not
   present room metadata as a live event;
6. independently query every fixture, including the real kind-31923 calendar
   event used by My Night, and verify all Nostr signatures;
7. delete the exact relay and Docker volume in `finally`.

Additional implementation QA must cover: zero profiles, profile without presence, left replacement, expired/fallback-stale presence, newer/older/equal-time replacement ordering, malformed profile, wrong room `a`, reconnect, background/foreground heartbeat, and switching to a second relay without mixed roster data.

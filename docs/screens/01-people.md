# 01 — People in the room

## Product contract

People is the default destination after a successful room join. It proves that exactly one venue relay is active, shows only opted-in visible presence, and never exposes distance, popularity, or hidden attendance. Quiet visitors retain full read, ordering, ticket, and membership access without appearing in this roster.

Entry requires a persisted `ActiveRoom`. With no active room, route to Discover. The header uses the signed manifest name and the fixed state **Connected in the room**; it must not infer venue identity from profiles or local copy.

## UI and interaction

- Header: signed room name, connection state, Menu, My night, and Leave.
- Local switch: People and Room feed. It changes only the active-room view.
- Roster: display name, intent, and optional context in deterministic accessible order. No per-person "online" dot is rendered; roster membership is the only presence signal and it is already textual.
- Cards may form a loose coaster-like constellation, but the semantic order is alphabetical and tap targets remain at least 44 points.
- The visible count counts current, non-expired, explicitly visible presence projections only.
- Tapping a person opens screen 02 with their relay-derived public key; no name is used as identity.

## State and relay contract

`RoomSessionProvider` owns only the durable active-room selection. `RoomDataProvider` owns the live projection and gives each concurrent event family a stable room-scoped subscription ID on the one device transport URL.

Relevant events:

- NIP-53 kind `10312` with exact `a=31727:<NIP-11-root>:community`;
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

Name, intent, and context are text. Reading order is predictable despite the organic visual layout. No exact distance, table number, follower count, profile-open count, or non-room activity is rendered. Quiet mode is never visually treated as degraded access.

## QA strategy

Unit coverage in `RoomScreen.test.tsx` verifies populated and quiet-empty paths and person identity routing. Native workflow `maestro/flows/01-people.yaml` enters quietly through the real join screen, waits for live relay projections, checks the exact visible-only count, and captures the canonical state.

`.qa/qa-01-people.mjs` owns an independent lifecycle:

1. create an isolated Nuts coordinator relay and record its exact relay/volume IDs;
2. issue fixture membership awards through the same gate as production;
3. publish the compatibility selector plus signed profiles, anchor-bound NIP-53 presences, feed, catalog, membership, and event fixtures;
4. enter the room on Android using the emulator transport alias;
5. assert the screen consumed profile and presence FlatBuffers;
6. independently query every fixture and verify all Nostr signatures;
7. delete the exact relay and Docker volume in `finally`.

Additional implementation QA must cover: zero profiles, profile without presence, left replacement, expired/fallback-stale presence, newer/older/equal-time replacement ordering, malformed profile, wrong community `a`, reconnect, background/foreground heartbeat, and switching to a second relay without mixed roster data.

# People in the room

**Canonical contract:** [docs/screens/01-people.md](../../../screens/01-people.md)  
**Code:** `src/app/(tabs)/room.tsx` → `src/screens/room/RoomScreen.tsx`  
**Mockup:** [room and feed board](../mockups/01-room-and-feed-v1.png), panel 02

## Night Playlist treatment

The room view is **The Skyline Room / Right now**. A thin current-moment rail
sits below the header. The visible roster is a friendly strip or grid attached
to the current moment, labelled by intent. It is not a map, distance display,
rank, or online indicator.

## Motion contract

- After the active room is verified, draw the current rail marker once and
  reveal the first visible people as one settled batch.
- Switching People ↔ Room feed uses a 280 ms crossfade/shared-axis transition;
  preserve scroll position and the local view state.
- Tapping a person lifts the avatar into the profile sheet over `tempo-sheet`.
- New or removed presence updates the count with a number crossfade only. Do
  not make every avatar bounce or drift.
- Empty, quiet, connecting, stale, and expired states replace content in place;
  they never spin indefinitely.

## Protocol and accessibility

Visible presence remains relay-derived and opt-in. The visual roster has a
deterministic semantic list order, 48 dp targets, labels for intent, and a
reduced-motion list fallback. The relay count is text, not a badge animation.

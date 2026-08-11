# Room feed

**Canonical contract:** [docs/screens/03-room-feed.md](../../../screens/03-room-feed.md)  
**Code:** `src/app/(tabs)/room.tsx` → `src/screens/room/RoomScreen.tsx`  
**Mockup:** [room and feed board](../mockups/01-room-and-feed-v1.png), panel 03

## Night Playlist treatment

The feed is **The Skyline Room / Feed**: a chronological set of moments on one
active relay. Announcements use a strong labelled moment block; guest posts
use lighter notes. The composer is **Add a note** / **Post to this room**, not a
floating social-media compose button.

## Motion contract

- Switching from People crossfades to the feed while keeping the room header and
  current moment marker stable.
- New relay content enters as one short fade/slide batch at the top; existing
  history never reorders visually because of arrival timing.
- Opening the composer expands the bottom action into a keyboard-safe field over
  `tempo-sheet`; focus is immediate and the tab bar yields to the keyboard.
- Publish shows a local submitting state, then settles only after relay OK. A
  rejection or timeout returns the draft without a success animation.
- On expiry/leave, freeze the last feed frame once, then crossfade to the locked
  state. Never leave a disabled composer spinning.

Report, malformed content, wrong room, duplicates, and expiry remain explicit
text states. No likes, reposts, popularity counts, or global-feed escape hatch.

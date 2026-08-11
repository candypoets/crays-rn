# Room preview

**Canonical contract:** [docs/screens/10-room-preview.md](../../../screens/10-room-preview.md)  
**Code:** `src/app/room-preview.tsx` → `src/screens/discovery/RoomPreviewScreen.tsx`  
**Mockup:** [discovery and access board](../mockups/05-discovery-and-access-v1.png), panel 03

## Night Playlist treatment

The venue hero is the one immersive moment: image, room name, verified state,
current event, and capabilities. Keep the bottom actions operational:
**Preview room** and **Enter room**. The screen never implies the user has
joined before the explicit action.

## Motion contract

- Load the hero with a restrained crossfade; text and actions appear together,
  never in a long marketing stagger.
- Tapping Preview room opens the room preview content without subscribing to the
  live feed or publishing presence.
- Enter room pushes to Join Privacy. A stale/forged result replaces the hero in
  place with a verification failure over `tempo-fade`.
- Back returns to the discovery result with its selected card and scroll state.

Verification text, expiry, relay identity, and room capability claims remain
semantic and readable. The image is atmosphere, not authority.

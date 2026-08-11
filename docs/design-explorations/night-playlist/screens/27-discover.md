# Discover rooms

**Canonical contract:** [docs/screens/27-discover.md](../../../screens/27-discover.md)  
**Code:** `src/app/(tabs)/discover.tsx` → `src/screens/DiscoverHandoffScreen.tsx`  
**Mockup:** [discovery and access board](../mockups/05-discovery-and-access-v1.png), panel 01

## Night Playlist treatment

Discover is **Tonight / rooms around you**. Cards are verified room moments,
not people, popularity rankings, or attendance claims. Nearby and Map resolve to
the same room descriptor and open the same preview route.

## Motion contract

- The selected room card expands with a 280 ms shared-axis transition into the
  preview route; do not auto-enter.
- Nearby results may enter as a single settled batch. A new result changes the
  list with a short fade, not a map-pin chase.
- Switching Nearby/Map preserves the selected descriptor and uses a 180 ms
  crossfade. A disabled Map state remains visibly disabled and cannot animate as
  if available.
- Offline, forged, stale, empty, and test-room states replace only the result
  area; tabs and Messages/Me remain responsive.

No room relay subscription or presence mutation begins here. The visual “live”
language describes the room listing, not an active session.

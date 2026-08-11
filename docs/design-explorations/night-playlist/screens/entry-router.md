# Entry router

**Canonical contract:** [docs/screens/entry-router.md](../../../screens/entry-router.md)  
**Code:** `src/app/index.tsx`  
**Mockup:** [entry and account board](../mockups/02-entry-and-account-v1.png)

## Night Playlist treatment

The router is invisible. It chooses the first honest chapter: Welcome,
Discover, Room, Room ended, or a preserved invite/access intent. No animated
interstitial may appear between the decision and the destination.

## Motion contract

- Resolve protected state before mounting the tab shell.
- Use the native stack transition only when a real route changes.
- A cold entry fades into Welcome; an authenticated entry crossfades into Room
  or Discover after the route guard settles.
- Preserved invite context travels through the route without a second splash or
  a replayed permission explanation.

## Non-negotiables

Entry routing never creates a manager, publishes presence, selects a relay, or
requests Nearby permission. Back and deep-link semantics remain owned by Expo
Router.

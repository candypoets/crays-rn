# Primary tabs

**Canonical contract:** [docs/screens/primary-tabs.md](../../../screens/primary-tabs.md)  
**Code:** `src/app/(tabs)/_layout.tsx` → `src/navigation/primaryTabs.ts`  
**Mockup:** all Night Playlist boards

## Night Playlist treatment

Keep the four native destinations—Room, Discover, Messages, Me. The selected
tab uses electric blue plus a text label; unselected tabs stay quiet. On an
active room, the Room tab may carry the current-moment glyph, but never a
badge that implies popularity.

## Motion contract

- Selecting a tab changes content in place with `tempo-route` fade-through and
  never pushes a stack route.
- Each tab remains mounted according to the existing navigator contract, so
  scroll position, selected room view, and drafts survive tab changes.
- The tab bar yields to the keyboard and returns when it closes.
- Android Back from a noninitial tab returns to the initial Room tab; it does
  not replay tab presses.

The tab navigator performs no Nostr query, publish, identity, or relay work.

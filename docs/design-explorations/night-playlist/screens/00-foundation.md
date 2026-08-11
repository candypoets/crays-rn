# Foundation / runtime gate

**Canonical contract:** [docs/screens/00-foundation.md](../../../screens/00-foundation.md)  
**Code:** `src/app/_layout.tsx` → `src/screens/FoundationScreen.tsx`  
**Mockup:** [entry and account board](../mockups/02-entry-and-account-v1.png)

## Night Playlist treatment

This is the quiet prelude, not a branded splash screen. Use a pale lilac field,
deep-plum `CRAYS`, and one thin horizontal tempo rail labelled **Waking the
room**. No venue content is shown until the native Nostr runtime is ready.

## Motion contract

- On mount, the `CRAYS` wordmark fades in over `tempo-fade`.
- The rail draws once over `tempo-moment`; it does not loop while startup is
  slow.
- When ready, crossfade directly into the entry route over `tempo-route`.
- When unavailable or failed, freeze the rail and replace it with the explicit
  Foundation explanation. The error state must not shake or pulse.

## Accessibility and failure

The status is announced as text and a labelled state, not by the rail alone.
Reduce Motion skips the draw and uses one crossfade. Startup never creates a
fake room, relay, identity, or permission state.

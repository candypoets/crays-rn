# My Night

**Canonical contract:** [docs/screens/05-my-night.md](../../../screens/05-my-night.md)  
**Code:** `src/app/my-night.tsx` → `src/screens/durable/NightAndOrderScreens.tsx`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 02

## Night Playlist treatment

My Night is the **Up next** surface, not an archive. Put the next valid event
credential first, then the active order, then the relevant membership benefit.
The screen should feel like a calm backstage cue sheet after the brighter Room
experience.

## Motion contract

- On entry, the selected room moment fades into the Up next header over
  `tempo-moment`; the content cards enter as one stable stack.
- The priority row changes only when the derived entitlement/order state changes;
  use a 420 ms rail transition and a short text crossfade.
- Opening a ticket or order pushes a normal detail route. Back returns to My
  Night without resetting its local scroll state.
- A credential revoked/exhausted or order terminal state leaves the surface with
  a single state transition; it is not silently replaced by a fake next item.

The QR is rendered only for a valid event-access credential, with a white quiet
zone. Leaving locks this contextual surface but never deletes durable records.

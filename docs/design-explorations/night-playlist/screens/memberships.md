# Memberships

**Canonical contract:** [docs/screens/memberships.md](../../../screens/memberships.md)  
**Code:** `src/app/memberships.tsx` → `src/screens/durable/MembershipEventScreens.tsx`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 05

## Night Playlist treatment

Memberships are durable rooms-within-the-night: benefits, active state, use
ledger, and management. Use a compact “your perks” rail, never points, streaks,
or popularity language.

## Motion contract

- The membership list enters as a stable grouped list.
- Opening an offer/detail route uses native push; benefit rows do not cascade.
- Benefit use/status updates crossfade the specific row after trusted relay data
  arrives.
- Loading, unavailable, revoked, renewal, and cancellation states retain the
  same route frame and Back action.

The room relay and trust rules own status; local counters are not animated into
existence.

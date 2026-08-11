# Switch rooms

**Canonical contract:** [docs/screens/28-switch-room.md](../../../screens/28-switch-room.md)  
**Code:** `src/app/switch-room.tsx` → `src/screens/room/LeaveAndSwitchScreens.tsx`  
**Mockup:** [discovery and access board](../mockups/05-discovery-and-access-v1.png), panel 05

## Night Playlist treatment

Use a two-chapter comparison: **You are in** and **You’re entering**. The
current room and destination retain their own verified imagery and names. The
copy states exactly what ends before the red commitment action.

## Motion contract

- Opening is a normal sheet/stack transition, not a swipeable card that could
  accidentally switch rooms.
- Destination verification enters with a quiet progress rail; it never implies
  success before the manifest resolves.
- Confirming first settles the leave/switch protocol, then transitions to Join
  Privacy. A failed switch reverses to this screen and preserves the current
  room.
- Cancel reverses without changing subscriptions or presence.

There is exactly one active room relay. The animation must not suggest two live
rooms at once.

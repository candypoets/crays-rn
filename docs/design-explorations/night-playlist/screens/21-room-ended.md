# Room ended

**Canonical contract:** [docs/screens/21-room-ended.md](../../../screens/21-room-ended.md)  
**Code:** `src/app/room-ended.tsx` → `src/screens/room/LeaveAndSwitchScreens.tsx`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 07

## Night Playlist treatment

This is the final quiet note of the set: **Your time at The Skyline Room
ended**. The live feed and visibility closure are prominent, while durable
items appear as a reassuring retained list.

## Motion contract

- Enter with one 280 ms crossfade; no celebration, confetti, or “left the room”
  announcement.
- The lock icon and retained-items list appear together, not as a staged error.
- Discover another room pushes to Discover. Open Messages switches to the
  Messages tab without replaying the previous room stack.
- Automatic expiry and explicit leave use the same settled layout with distinct
  explanatory copy.

Messages, orders, tickets, passes, memberships, and wallet state remain
interactive according to their own relay/cache contracts.

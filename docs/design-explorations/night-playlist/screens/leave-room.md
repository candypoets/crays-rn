# Leave room

**Canonical contract:** room-leave behavior in [docs/screens/21-room-ended.md](../../../screens/21-room-ended.md) and the PRD  
**Code:** `src/app/leave-room.tsx` → `src/screens/room/LeaveAndSwitchScreens.tsx`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 07

## Night Playlist treatment

This is a standard, calm privacy decision. Use a short list of consequences:
presence ends, the live feed locks, durable messages/orders/tickets/memberships
remain. Do not make leaving feel like a social event.

## Motion contract

- Open with the native stack transition and no background parallax.
- Confirming disables repeat taps and shows a determinate “Leaving…” label.
- After the leave publish and local session clear succeed, crossfade to Room
  Ended. On timeout/error, keep the screen and draft action available.
- Cancel returns to the active Room and restores focus to Leave.

The transition is protocol-gated. Never remove presence or show a privacy
completion state because the button was pressed optimistically.

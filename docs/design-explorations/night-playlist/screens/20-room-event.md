# Room event

**Canonical contract:** [docs/screens/20-room-event.md](../../../screens/20-room-event.md)  
**Code:** `src/app/event.tsx` → `src/screens/durable/MembershipEventScreens.tsx`  
**Mockup:** [discovery and access board](../mockups/05-discovery-and-access-v1.png), panel 06

## Night Playlist treatment

An event is a room moment with a clear next action: Save event, RSVP, or Get
ticket only when the underlying state supports it. The page uses one hero image
and a timeline line for time, venue, and access—not a generic card grid.

## Motion contract

- Open from Discover with the event image shared into the hero over `tempo-route`.
- Save/RSVP updates the action label only after the correct relay/persistence
  result; use a short checkmark settle, never confetti.
- If an event is removed or unavailable, crossfade its body into the explicit
  failure state and retain Back.
- Opening a valid ticket pushes to Ticket Detail; a calendar-only event opens
  ordinary detail and never animates a QR into existence.

Event identity, room identity, access definition, and credential status remain
textual and independently verifiable.

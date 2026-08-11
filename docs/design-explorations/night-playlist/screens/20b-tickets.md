# Tickets and passes

**Canonical contract:** [docs/screens/20b-tickets.md](../../../screens/20b-tickets.md)  
**Code:** `src/app/tickets.tsx` → `src/screens/durable/TicketScreens.tsx`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 04

## Night Playlist treatment

Tickets are durable access objects. The list uses event moments, validity text,
and a clear route to Show at the door; it does not make every calendar event
look like a credential.

## Motion contract

- Valid credentials enter as a stable list; QR is not generated in the list.
- Opening a ticket pushes to Ticket Detail with the event image/label shared into
  the header.
- Revoked, exhausted, expired, and calendar-only states crossfade their copy in
  place and remove only the invalid action.
- Returning from detail preserves the list position and selected room context.

The list is safe at large text sizes and screen-reader order follows event,
validity, and action.

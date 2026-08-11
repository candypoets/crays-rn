# Ticket detail

**Canonical contract:** [docs/screens/20c-ticket-detail.md](../../../screens/20c-ticket-detail.md)  
**Code:** `src/app/ticket.tsx` → `src/screens/durable/TicketScreens.tsx`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 04

## Night Playlist treatment

This is a door-ready tool: event/room name, validity, remaining uses, and a
large scanner-safe QR quiet zone. Use the phrase **Show at the door** and keep
details one tap away.

## Motion contract

- Enter with a normal route transition; QR fades in only after the valid
  credential is resolved.
- Brightness boost, copy, or presentation controls use `tempo-press` and do not
  move the QR.
- Exhausted/revoked/invalid status replaces the QR with the reason; never leave
  a stale code visible while a request is pending.
- Back returns to Tickets or My Night according to the invoking route.

The white quiet zone remains intact in every theme, brightness, and reduced
motion state.

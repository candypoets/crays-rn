# Orders

**Canonical contract:** [docs/screens/17-orders.md](../../../screens/17-orders.md)  
**Code:** `src/app/orders.tsx` → `src/screens/durable/NightAndOrderScreens.tsx`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 03

## Night Playlist treatment

Active orders sit at the top as the current set; history is quiet and grouped
by date. Each row exposes recipient/venue/item/status without internal ids.

## Motion contract

- Open from Me with a native push and preserve the list on Back.
- Active status changes update the row’s rail with `tempo-status`; historical
  rows do not animate on every refresh.
- Opening an order shares its status color/label into Order Detail.
- Empty, offline, cancelled, and refund states replace the relevant row with
  explanatory copy, not a global loading screen.

Order history remains available after leaving the room.

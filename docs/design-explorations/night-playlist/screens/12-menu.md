# Room menu

**Canonical contract:** [docs/screens/12-menu.md](../../../screens/12-menu.md)  
**Code:** `src/app/menu.tsx` → `src/screens/commerce/MenuScreen.tsx`  
**Mockup:** [commerce and messages board](../mockups/03-commerce-and-messages-v1.png), panel 01

## Night Playlist treatment

The menu is the venue’s current setlist: Drinks, Food, Events, Membership.
Sections are content-first, with product images and price. The active room
moment stays in the header so ordering never feels like leaving the night.

## Motion contract

- Opening from Room uses a 280 ms route transition; the selected section and
  scroll position are retained on Back.
- Section changes crossfade content in 180 ms, preserving the header and cart
  state.
- Add opens Item Detail with a shared product image; it does not immediately
  place an order.
- Relay failure/empty catalog replaces only the list with retry/support copy.

Only operator-signed available products are actionable. No optimistic kitchen
status is shown from a button press.

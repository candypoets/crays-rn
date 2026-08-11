# Gift select

**Canonical contract:** [docs/screens/04-gift-select.md](../../../screens/04-gift-select.md)  
**Code:** `src/app/gift-select.tsx` → `src/screens/commerce/GiftSelectScreen.tsx`  
**Mockup:** [commerce and messages board](../mockups/03-commerce-and-messages-v1.png), panel 07

## Night Playlist treatment

The screen is a focused “send a drink” moment. Maya remains pinned at the top;
eligible drinks read like the next available selections in the venue set, with
price and product identity always visible.

## Motion contract

- Enter from Maya’s sheet with the recipient chip shared across the route.
- Selecting a product changes only the selected rail/card, image, and price over
  `tempo-press`; do not auto-submit or replace the recipient.
- The explicit Review gift action pushes to Gift Review.
- Empty, blocked, left, unavailable, alcohol-restricted, or expired states
  crossfade in place and preserve the safe Back path.

Only operator-signed available drinks are shown. Gift selection never creates a
payment or order event; protocol work starts at the review/checkout boundary.

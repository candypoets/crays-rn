# Gift review

**Canonical contract:** [docs/screens/23-gift-review.md](../../../screens/23-gift-review.md)  
**Code:** `src/app/gift-review.tsx` → `src/screens/commerce/GiftReviewScreen.tsx`  
**Mockup:** [commerce and messages board](../mockups/03-commerce-and-messages-v1.png), panel 07

## Night Playlist treatment

Gift review is the highest-trust commerce frame: Maya, drink, note, price,
payment method, decline/refund policy, and the exact sentence **The bar gets
the order. Maya gets the ticket.** are visible together.

## Motion contract

- Enter from Gift Select with the recipient and product shared in place.
- Editing the optional note does not move the recipient or total; keyboard insets
  keep Review/Send reachable.
- Review-to-send is an explicit action, not a swipe or auto-advance.
- On confirmed success, the button settles once and routes to Order Detail/My
  Night. On false/timeout, retain the draft and show retry without a second
  send path.
- Decline returns to the person context and never reveals location/table data.

The gift guard repeats accepted-conversation, current-room, eligibility, and
availability checks at route entry.

# Review and pay

**Canonical contract:** [docs/screens/14-review-pay.md](../../../screens/14-review-pay.md)  
**Code:** `src/app/review-pay.tsx` → `src/screens/commerce/ReviewPayScreen.tsx`  
**Mockup:** [commerce and messages board](../mockups/03-commerce-and-messages-v1.png), panel 03

## Night Playlist treatment

Review is a deliberate downbeat: venue, order, payment method, total, and
commitment policy are all visible before **Place order · €12**. Keep fiat first;
do not turn checkout into a wallet demo.

## Motion contract

- Enter with a normal route transition from Item/Menu.
- Quantity/removal updates the total with a 180 ms crossfade while preserving
  the primary action’s position.
- Payment method opens a child route and returns with the chosen method in
  place, without resetting the order.
- Checkout disables repeat taps and shows a determinate status.
- Relay/processor success routes to Order Detail only after the required success;
  false/timeout keeps the cart and draft intact.

Uncertain outcomes must never animate to Served, Delivered, or a duplicate
receipt.

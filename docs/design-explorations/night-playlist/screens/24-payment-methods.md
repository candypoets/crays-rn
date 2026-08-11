# Payment methods

**Canonical contract:** [docs/screens/24-payment-methods.md](../../../screens/24-payment-methods.md)  
**Code:** `src/app/payment-methods.tsx` → `src/screens/commerce/PaymentMethodsScreen.tsx`  
**Mockup:** [commerce and messages board](../mockups/03-commerce-and-messages-v1.png), panel 04

## Night Playlist treatment

Use a clean grouped list of configured methods. Available methods get a single
selected role; unavailable methods explain why. This is an operational pause in
the set, not a decorative payment carousel.

## Motion contract

- Rows enter as one list, not a long stagger.
- Selecting a method gets a 120 ms checkmark/focus response, then returns to the
  owning checkout route with native Back/replace semantics.
- A method becoming unavailable crossfades its reason in place and never moves
  the selected total.
- The keyboard/payment handoff does not hide the confirmation action.

No wallet balance, processor capability, or success is fabricated by the row
animation.

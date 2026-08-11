# Membership offer

**Canonical contract:** [docs/screens/18-membership-offer.md](../../../screens/18-membership-offer.md)  
**Code:** `src/app/membership-offer.tsx` → `MembershipOfferScreen`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 05

## Night Playlist treatment

The offer is a clear benefits-and-cadence page. A current room moment can
anchor the hero, but the price, recurrence, renewal, cancellation, and exact
benefits remain operational text.

## Motion contract

- Enter with the venue moment shared into the offer header.
- Selecting a payment method returns in place; no automatic checkout jump.
- Purchase action becomes determinate and disables repeat taps.
- Success routes to Membership Detail only after the required trusted status;
  rejection/timeout preserves the offer and shows retry.

Do not use a progress rail to imply membership was granted before protocol
confirmation.

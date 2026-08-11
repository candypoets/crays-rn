# Cold welcome

**Canonical contract:** [docs/screens/06-cold-welcome.md](../../../screens/06-cold-welcome.md)  
**Code:** `src/app/welcome.tsx` → `src/screens/onboarding/ColdWelcomeScreen.tsx`  
**Mockup:** [entry and account board](../mockups/02-entry-and-account-v1.png), panel 01

## Night Playlist treatment

Open on **Your night starts here** with a small upcoming-moments rail. The first
screen proves the product is about real rooms, not a generic social network.
Keep Create account and Log in visible without a tutorial carousel.

## Motion contract

- The moments rail draws once over `tempo-moment`; it does not autoplay through
  fake venues.
- Create account and Log in use normal stack transitions; the welcome frame
  does not slide away before navigation is acknowledged.
- Returning from account setup restores the same welcome scroll position.
- Error or unavailable identity state is a calm inline message, not a shake.

The privacy promise remains text and must not claim location tracking is absent
if a later Nearby flow is intentionally enabled.

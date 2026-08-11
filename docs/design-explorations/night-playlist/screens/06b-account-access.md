# Account access

**Canonical contract:** [docs/screens/06b-account-access.md](../../../screens/06b-account-access.md)  
**Code:** `src/app/account-access.tsx` → `src/screens/onboarding/AccountAccessScreen.tsx`  
**Mockup:** [entry and account board](../mockups/02-entry-and-account-v1.png), panel 02

## Night Playlist treatment

Use a compact pre-show checklist: local and private, built for real places,
provider login unavailable in this build. The primary action is **Create on
this device**; unsupported Apple/Google paths are explained, not rendered as
dead buttons.

## Motion contract

- Selecting local creation fills the primary action with a 120 ms press response,
  then pushes to Profile Setup.
- Loading replaces the label with a stable progress state; no repeated tap can
  create another identity.
- Failure keeps the same form and crossfades only the error copy.
- Back returns to Welcome using the native reverse transition.

Identity creation remains the route owner’s side effect. The visual state never
claims the identity exists before secure storage succeeds.

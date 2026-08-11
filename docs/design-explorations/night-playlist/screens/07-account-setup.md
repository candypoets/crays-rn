# Account setup

**Canonical contract:** [docs/screens/07-account-setup.md](../../../screens/07-account-setup.md)  
**Code:** `src/app/profile.tsx` → `src/screens/onboarding/ProfileSetupScreen.tsx`  
**Mockup:** [entry and account board](../mockups/02-entry-and-account-v1.png), panel 03

## Night Playlist treatment

Ask only **How should the room call you?** Keep display name first. Intent
choices are optional, bright, and clearly reversible; they seed room context but
never make visibility automatic.

## Motion contract

- Focus the display-name field on entry only when appropriate; keep keyboard and
  Continue reachable at large text sizes.
- Intent selection changes border/fill over `tempo-press`; selecting an intent
  does not jump to a new step.
- Continue pushes to the preserved invite/discover context with a 280 ms route
  transition after profile persistence succeeds.
- Validation remains beside the field; never animate the whole form on error.

No photo/bio/intention claim is required to enter a room. The optional data is
not published until its existing product contract allows it.

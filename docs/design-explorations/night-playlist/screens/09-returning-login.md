# Returning login

**Canonical contract:** [docs/screens/09-returning-login.md](../../../screens/09-returning-login.md)  
**Code:** `src/app/login.tsx` → `src/screens/onboarding/LoginScreen.tsx`  
**Mockup:** [entry and account board](../mockups/02-entry-and-account-v1.png), panel 08

## Night Playlist treatment

Returning login is an unlock cue: **Welcome back** and the preserved room/invite
context remain visible. Device unlock is primary; recovery is a quieter route.

## Motion contract

- The unlock affordance uses one focused ring while the native unlock request is
  active; no infinite spinner or fake biometric animation.
- Success crossfades into the preserved destination and never replays onboarding.
- Failure returns to the same button with exact recovery copy.
- Provider options that are not configured stay explanatory and inert.

Login only unlocks/restores the durable identity. It does not join a room or
publish visibility as a side effect.

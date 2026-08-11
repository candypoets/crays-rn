# Account recovery

**Canonical contract:** [docs/screens/07b-account-recovery.md](../../../screens/07b-account-recovery.md)  
**Code:** `src/app/recovery.tsx` → `src/screens/onboarding/RecoveryScreen.tsx`  
**Mockup:** [entry and account board](../mockups/02-entry-and-account-v1.png), panel 08 variant

## Night Playlist treatment

Recovery is a serious backstage warning, not a neon feature moment. Use the
same pale surface and tempo rail, but stop the rail at the consequence copy.

## Motion contract

- Enter with a normal stack transition from Login/Profile.
- Recovery action shows a determinate loading label and disables repeat taps.
- Success returns to the preserved entry context with one crossfade; failure
  keeps the warning and offers Back.
- Never animate raw keys or imply cross-device recovery when it is unavailable.

The warning must remain readable in screen-reader order and at large text sizes.

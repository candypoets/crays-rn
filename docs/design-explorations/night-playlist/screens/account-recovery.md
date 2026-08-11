# Account recovery unavailable state

**Canonical contract:** the recovery boundary in [docs/screens/07b-account-recovery.md](../../../screens/07b-account-recovery.md)  
**Code:** `src/app/account-recovery.tsx`  
**Mockup:** [entry and account board](../mockups/02-entry-and-account-v1.png), panel 08 variant

## Night Playlist treatment

This route is an explicit unavailable capability, not a fake recovery wizard.
Use the same calm deep-plum warning language as Login/Recovery and state what
will not be overwritten.

## Motion contract

- Enter with the native stack transition.
- The unsupported-method explanation is static and immediately readable.
- Back to Login uses the reverse route transition; no progress rail starts.
- If recovery is later enabled, this route may become a real flow, but the
  current unavailable state must not visually promise it.

# Workflow — Cold signup on this device

## Outcome

A clean install creates one app-local nipworker Nostr identity, signs a minimal profile, acknowledges that removing Crays removes local access unless the key is recoverable elsewhere, and lands at Discover without requesting permissions or contacting an arbitrary relay.

## Sequence and invariants

1. Entry router resolves empty state to Screen 06.
2. Screen 06 chooses Create account.
3. Screen 06B generates exactly one identity and nipworker persists its signer account in the native app container; Crays writes no credential copy to SecureStore.
4. Screen 07 signs and verifies exactly one kind-0 for the normalized display name through nipworker.
5. Screen 07B records device-only completion after explicit acknowledgement.
6. Discover handoff renders.

At every interruption boundary, an ordinary relaunch resumes at the first incomplete step. A cleared package or true uninstall removes the nipworker account and returns to Welcome even if legacy Keychain items survive. Back never deletes a key or signed draft. The secret is never logged. The flow opens no relay, subscription, Bluetooth scan, location request, camera request, contact request, or notification request.

## Automated QA stack

- Component tests own deterministic UI states.
- `maestro/flows/cold-signup.yaml` exercises the public UI from cleared package data.
- `.qa/qa-entry-bootstrap.mjs` clears logcat and records isolated scenario state.
- `.qa/qa-entry-verify.mjs` parses the public-safe QA markers, requires exactly one identity, profile, and completion side effect, independently verifies the Nostr signature and profile content with `nostr-tools`, proves zero relay/subscription counts, and checks the recorded recovery mode.
- `.qa/qa-entry-teardown.mjs` clears only `life.crays` and removes the scenario state file.
- `scenario:cold-signup` composes the complete bootstrap → exercise → verify → teardown lifecycle.

## Required follow-up scenarios

Returning login/import and invite-priority routing are now separate delivered workflows: see `docs/screens/09-returning-login.md` (`scenario:09-returning-login`) and `docs/screens/08-invite-preview.md` (`scenario:08-invite-preview`, `scenario:08b-invite-accepted`). What genuinely remains for a later entry slice is process death during an active identity/profile write and corrupted SecureStore recovery. Neither is claimed by this cold-signup scenario.

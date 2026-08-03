# Workflow — Cold signup on this device

## Outcome

A clean install creates one device-protected Nostr identity, signs a minimal profile, acknowledges that cross-device recovery is not configured, and lands at Discover without requesting permissions or contacting an arbitrary relay.

## Sequence and invariants

1. Entry router resolves empty state to Screen 06.
2. Screen 06 chooses Create account.
3. Screen 06B generates and securely persists exactly one identity.
4. Screen 07 signs and verifies exactly one kind-0 for the normalized display name at the protected local custody boundary.
5. Screen 07B records device-only completion after explicit acknowledgement.
6. Discover handoff renders.

At every interruption boundary, relaunch resumes at the first incomplete step. Back never deletes a key or signed draft. The secret is never logged. The flow opens no relay, subscription, Bluetooth scan, location request, camera request, contact request, or notification request.

## Automated QA stack

- Component tests own deterministic UI states.
- `maestro/flows/cold-signup.yaml` exercises the public UI from cleared package data.
- `.qa/qa-entry-bootstrap.mjs` clears logcat and records isolated scenario state.
- `.qa/qa-entry-verify.mjs` parses the public-safe QA markers, requires exactly one identity, profile, and completion side effect, independently verifies the Nostr signature and profile content with `nostr-tools`, proves zero relay/subscription counts, and checks the recorded recovery mode.
- `.qa/qa-entry-teardown.mjs` clears only `life.crays` and removes the scenario state file.
- `.qa/qa-cold-signup.mjs` composes the complete bootstrap → exercise → verify → teardown lifecycle.

## Required follow-up scenarios

Returning login/import and invite-priority routing are now separate delivered workflows: see `docs/screens/09-returning-login.md` (`.qa/qa-09-returning-login.mjs`) and `docs/screens/08-invite-preview.md` (`.qa/qa-08-invite-preview.mjs`, `.qa/qa-08b-invite-accepted.mjs`). What genuinely remains for a later entry slice is process death during an active identity/profile write and corrupted SecureStore recovery. Neither is claimed by this cold-signup scenario.

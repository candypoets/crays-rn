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

The next entry slice must add process death during an active identity/profile write, corrupted SecureStore recovery, returning login/import, and invite-priority routing. Those are separate workflows and must not be claimed by this cold-signup scenario.

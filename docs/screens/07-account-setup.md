# 07 — Minimal account setup

## Product requirement

Ask only for the name people should see. Photo, bio, intent, and room-specific context remain optional until useful. Continuing signs a real Nostr kind-0 profile with the already-created local identity.

Canonical visual reference: `assets/screens/07-account-setup.png`.

## Data contract

- Display name is trimmed, repeated whitespace is collapsed, and length after trimming must be 2–50 characters.
- The signed kind-0 content is JSON with both `name` and `display_name` set to the normalized value for compatibility.
- The event uses no tags in this slice and a current Unix timestamp.
- The signed event pubkey must equal the protected draft pubkey and `verifyEvent` must pass before storage.
- The signed event is stored locally for later publication to a justified identity or venue relay; this screen does not choose an arbitrary public backend.

## Interaction

- Back returns to Account access without deleting the protected draft key.
- Continue is disabled for invalid input and while signing.
- Return/keyboard behavior must not hide the field or primary action permanently.
- Successful signing replaces Profile with Recovery; Recovery explicitly routes Back to Profile without deleting the signed draft.

## States and failures

- Empty and valid input.
- Too short and maximum-length input.
- Signing in progress with repeat taps disabled.
- Missing native runtime, signing timeout, invalid signature, and storage failure all remain on-screen with explicit copy and retry.
- Relaunch before signing returns here. Relaunch after a valid signed profile returns to Recovery.

## Accessibility

- The prompt is the header; stage text is supplementary.
- The field has a persistent accessible label independent of placeholder text.
- The avatar is explicitly optional and no camera permission is requested.
- Validation and signing failures are announced through the error live region.

## Nostr and relay behavior

The local custody boundary keeps the durable `nsec` in SecureStore, passes only its decoded hex scalar to nipworker 0.97.11's React Native signer (the backend's required input), and signs the kind-0 through `useSignEvent` on the one shared manager. The secret never crosses into route or screen state. The returned event must match the protected draft pubkey and pass independent signature verification before storage. No publish or subscription occurs. A later relay-owned workflow publishes the stored signed kind-0 when the relay contract requires it.

## QA strategy

- Pure logic: `state.test.ts` checks normalization.
- Component: `ProfileSetupScreen.test.tsx` checks disabled/valid transitions, exact submitted value, and visible signature failure.
- Device: `maestro/flows/07-account-setup.yaml` creates a local identity, types and submits a realistic name, captures the screen, then relaunches and proves routing resumes at Recovery.
- Scenario: `.qa/qa-07-account-setup.mjs` independently requires exactly one valid signed profile, zero relay/subscription activity, and no completion marker before teardown.

## Exit criteria

- Valid input produces one verifiable kind-0.
- Invalid or repeated taps produce no signed event.
- No private key is logged.
- Relay and subscription counts remain zero.

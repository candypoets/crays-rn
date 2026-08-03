# 07B — Account recovery consequence

## Product requirement

The current slice has device-only custody. Screen 07B must explain that consequence before completion without pretending that Apple/Google or cross-device recovery exists. It also establishes the future guard: before adding money or purchasing durable items, Crays must require a real recoverable configuration.

Canonical visual reference: `assets/screens/07b-account-recovery.png`, adapted to device-only delivery.

## Content and hierarchy

- Back and **Account · 2 of 2**.
- **Keep your account with you**.
- Paper artifact explaining protected device custody.
- Selected **Continue on this device** consequence.
- **Continue to Discover**.
- Assurance that raw key material is never revealed unless explicitly requested.

## Interaction

- Finish checks that a verified signed profile exists, then writes the onboarding completion marker.
- Completion uses replace-navigation to `/discover` and cannot be duplicated by repeat taps.
- Back returns to Profile and leaves its signed draft intact.
- No recovery enrollment, cloud service, provider SDK, or key export is started here.

## States and failures

- Default device-only consequence.
- Saving with disabled repeat action.
- Missing/corrupt profile or SecureStore failure: remain on-screen and explain the corrective step.
- Relaunch before finish resumes here; relaunch after finish resolves to Discover.

## Accessibility

- Custody state is written in text rather than represented only by the selected ring/check.
- The button reports busy and disabled states.
- Large text can scroll to the action; decorative phone/lock/shield icons are supplementary.

## Nostr and relay behavior

No relay action occurs. Completion records local product state only. The `.qa` verifier proves the preceding kind-0 signature independently and asserts zero relay connections/subscriptions for the whole flow.

## QA strategy

- Component: `RecoveryScreen.test.tsx` checks explicit device-only and durable-item consequences, the finish action, and repeat-tap locking.
- Device: `maestro/flows/07b-account-recovery.yaml` creates/signs a fresh QA identity, asserts and captures the consequence state, proves Back reaches Profile, relaunches back into Recovery, finishes it, then relaunches and proves routing resumes at Discover.
- Scenario: `.qa/qa-07b-account-recovery.mjs` requires exactly one valid identity, profile, and device-only completion marker with zero relay/subscription activity before teardown.
- Workflow: `.qa/qa-cold-signup.mjs` additionally verifies the completion marker and Discover destination.

## Exit criteria

- A person cannot mistake this state for cross-device recovery.
- Finish requires a valid profile and routes exactly once.
- No secret or fake recovery material is exposed.

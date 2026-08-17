# 07B — Account recovery consequence

## Product requirement

Screen 07B explains the custody that was actually configured before completion. A local/imported key states the device-only consequence without pretending that biometric or cross-device recovery exists. NIP-46 states that signing and recovery remain with the connected signer and never claims its key is on this device. It also preserves the durable-item guard for device-only custody.

Visual authority: the Night Playlist entry/account board `docs/design-explorations/night-playlist/mockups/02-entry-and-account-v1.png`, **panel 08** as the visual family for this serious variant (blue lock/ring medallion language), with the treatment notes in `docs/design-explorations/night-playlist/screens/07b-account-recovery.md`. This supersedes the older `assets/screens/07b-account-recovery.png` reference.

## Content and hierarchy

- Back (upper left) and the plum Crays mark (upper right). This serious variant
  follows panel 08 and does not invent a progress-step indicator.
- Blue lock medallion: soft lilac outer ring, white ring, blue core with a white lock. Decorative; no biometric or unlock affordance is attached to it.
- **Keep your account with you** — centered headline.
- **This device, for now** — caption, then the custody truth: your private key stays protected on this device and cross-device recovery is not enabled yet.
- Guard row: before you add money or buy a durable item, Crays will ask you to add recovery.
- **Continue to Discover** — the one committed action.
- Assurance that raw key material is never revealed unless explicitly requested.

## Interaction

- Finish checks that a verified signed profile exists, then writes the onboarding completion marker.
- Completion uses replace-navigation to `/discover` and cannot be duplicated by repeat taps.
- Back returns to Profile and leaves its signed draft intact.
- No recovery enrollment, cloud service, provider SDK, biometric prompt, or key export is started here.

## States and failures

- Loading: no custody claim or finish action until the protected descriptor is validated.
- Device-only consequence.
- Connected NIP-46 signer consequence and signer-owned recovery copy.
- Saving with disabled repeat action.
- Missing/corrupt profile or SecureStore failure: remain on-screen and explain the corrective step.
- Relaunch before finish resumes here; relaunch after finish resolves to Discover.

## Accessibility

- Custody state is written in text; the medallion and check icons are decorative supplements hidden from screen-reader order.
- The button reports busy and disabled states.
- Large text can scroll to the action.

## Nostr and relay behavior

No relay action occurs. Completion records local product state only. The `.qa` verifier proves the preceding kind-0 signature independently and asserts zero relay connections/subscriptions for the whole flow.

## QA strategy

- Component: `RecoveryScreen.test.tsx` checks explicit device-only and durable-item consequences, the finish action, repeat-tap locking, error display, and Back routing.
- Device: `maestro/flows/07b-account-recovery.yaml` creates/signs a fresh QA identity, asserts and captures the consequence state, proves Back reaches Profile, relaunches back into Recovery, finishes it, then relaunches and proves routing resumes at Discover.
- Scenario: `.qa/qa-07b-account-recovery.mjs` requires exactly one valid identity, profile, and device-only completion marker with zero relay/subscription activity before teardown.
- Workflow: `.qa/qa-cold-signup.mjs` additionally verifies the completion marker and Discover destination.

## Exit criteria

- A person cannot mistake this state for cross-device recovery.
- Finish requires a valid profile and routes exactly once.
- No secret or fake recovery material is exposed.

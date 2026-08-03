# 06B — Account access method

## Product requirement

Screen 06B creates a Crays/Nostr identity through the one supported MVP-development method: **Create on this device**. Apple and Google access are intentionally omitted until their credential-to-Nostr recovery binding is designed. The screen must not render decorative provider buttons that do nothing.

Canonical visual reference: `assets/screens/06b-account-access.png`, adapted to the currently supported method.

## Content and hierarchy

- Back.
- Crays mark.
- **Create your Crays account** and the identity-boundary explanation.
- One local-device choice with plain consequences.
- A paper explanation that the Nostr identity remains the user's identity if access providers are added later.
- Primary **Create on this device** and quiet existing-account action.

## Interaction

Pressing either local-device affordance starts the same idempotent operation:

1. Read an existing draft identity from SecureStore, if present.
2. Otherwise generate 32 bytes from the platform cryptographic RNG.
3. Derive the Nostr public key and encode the secret as `nsec`.
4. Require and configure the existing nipworker manager's `privkey` signer.
5. Persist secret and public key using device-only secure-storage accessibility, rolling back both records on a storage failure.
6. Navigate to `/profile`.

The route disables both affordances while work is active. It must never create two identities from repeat taps.

## States and failures

- Default.
- Creating: both local actions disabled; progress label is announced as busy.
- Secure RNG, storage, or native signer unavailable: remain on screen with a specific recovery action and no navigation.
- Existing-account action: pushes `/login` (screen 09, implemented); no protected state changes.
- Relaunch after identity persistence: entry router resumes at Profile rather than returning here.

## Accessibility

- Back is a 48 dp target and platform Back remains functional.
- The choice exposes button semantics, busy/disabled state, a title, and a consequence.
- Errors use a live region and text; they do not rely on the error color or icon.

## Nostr and relay behavior

This screen creates Nostr signing identity but deliberately publishes nothing. The manager retains empty relay arrays; `getRelayStatuses()` and `getSubscriptionCount()` remain zero.

## QA strategy

- Component: `AccountAccessScreen.test.tsx` proves local-only choices, absent Apple/Google buttons, busy-state locking, callback routing, and visible error state.
- Device: `maestro/flows/06b-account-access.yaml` checks provider absence and that the existing-account action reaches the returning-login screen (09), double-taps identity creation, then relaunches and proves routing resumes at Profile.
- Scenario: `.qa/qa-06b-account-access.mjs` owns clean bootstrap, independently requires exactly one public identity marker with no profile/completion side effects, and tears down.
- Workflow: `cold-signup.yaml` presses the primary action and must reach Profile inside 30 seconds.

## Exit criteria

- One secure local identity survives relaunch.
- No secret appears in logs, UI, screenshots, or QA state files.
- No relay, subscription, provider SDK, or permission prompt is used.

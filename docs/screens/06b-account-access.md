# 06B — Account access method

## Product requirement

Screen 06B creates a Crays/Nostr identity through the one supported MVP-development method: **Create on this device**. Apple and Google access are intentionally omitted until their credential-to-Nostr recovery binding is designed. The screen must not render decorative provider buttons that do nothing; provider absence is explained as copy instead.

Visual authority: the Night Playlist entry/account board `docs/design-explorations/night-playlist/mockups/02-entry-and-account-v1.png`, **panel 02**, with the treatment notes in `docs/design-explorations/night-playlist/screens/06b-account-access.md`. This supersedes the older `assets/screens/06b-account-access.png` reference.

## Content and hierarchy

- Back (upper left) and the plum Crays mark (upper right).
- **Make a Crays identity**.
- A three-row pre-show checklist; each row is a soft lilac icon disc with a bold title and one consequence line:
  1. **Local and private** — Your identity lives on this device. It's not published anywhere.
  2. **Built for real places** — Join verified rooms. Your presence isn't shown before you enter.
  3. **Provider login isn't available** — Apple and Google sign-in aren't configured in this build.
- One bottom blue **Create on this device** primary action.
- **I already have an account** quiet text action.

## Interaction

Pressing the primary action starts the same idempotent operation:

1. Read an existing draft identity from SecureStore, if present.
2. Otherwise generate 32 bytes from the platform cryptographic RNG.
3. Derive the Nostr public key and encode the secret as `nsec`.
4. Require and configure the existing nipworker manager's `privkey` signer.
5. Persist secret and public key using device-only secure-storage accessibility, rolling back both records on a storage failure.
6. Navigate to `/profile`.

The route disables the action while work is active. It must never create two identities from repeat taps.

## States and failures

- Default.
- Creating: the primary action is disabled, announces busy, and its label becomes a stable progress state.
- Secure RNG, storage, or native signer unavailable: the same form stays; an error banner above the action shows specific recovery copy and there is no navigation.
- Existing-account action: pushes `/login` (screen 09, implemented); no protected state changes.
- Relaunch after identity persistence: entry router resumes at Profile rather than returning here.

## Accessibility

- Back is a 48 dp target and platform Back remains functional.
- Checklist rows are static text (title plus consequence); the primary action exposes button semantics with busy/disabled state.
- Errors use a live region and text; they do not rely on the error color or icon.

## Nostr and relay behavior

This screen creates Nostr signing identity but deliberately publishes nothing. The manager retains empty relay arrays; `getRelayStatuses()` and `getSubscriptionCount()` remain zero.

## QA strategy

- Component: `AccountAccessScreen.test.tsx` proves the checklist copy, single create affordance, absent Apple/Google buttons, busy-state locking, callback routing, and visible error state.
- Device: `maestro/flows/06b-account-access.yaml` checks provider absence and that the existing-account action reaches the returning-login screen (09), double-taps identity creation, then relaunches and proves routing resumes at Profile.
- Scenario: `.qa/qa-06b-account-access.mjs` owns clean bootstrap, independently requires exactly one public identity marker with no profile/completion side effects, and tears down.
- Workflow: `cold-signup.yaml` presses the primary action and must reach Profile inside 30 seconds.

## Exit criteria

- One secure local identity survives relaunch.
- No secret appears in logs, UI, screenshots, or QA state files.
- No relay, subscription, provider SDK, or permission prompt is used.

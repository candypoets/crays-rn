# Account recovery — unavailable state

## Product requirement

This route is an explicit unavailable capability, not a recovery wizard. Key import, remote signer, and provider recovery are not configured in this build, so the screen states that truth plainly and guarantees that no local identity will be overwritten. It must never claim biometric, provider, cloud, or cross-device recovery, and it must not visually promise a future flow.

Visual authority: the Night Playlist entry/account board `docs/design-explorations/night-playlist/mockups/02-entry-and-account-v1.png`, **panel 08 variant** (serious pale backstage language), with the treatment notes in `docs/design-explorations/night-playlist/screens/account-recovery.md`. Related custody boundary: `docs/screens/07b-account-recovery.md`.

## Content and hierarchy

- Back (upper left) and the plum Crays mark (upper right).
- Decorative soft-lilac key disc — backstage cue, hidden from screen-reader order.
- **Other ways to log in** header.
- Method truth: **Key import, remote signer, and provider recovery are not configured in this build.**
- No-overwrite truth: **Your identity, rooms, and preferences on this device stay untouched. No local identity will be overwritten.**
- One action: **Back to login**.

## Interaction

- Entry arrives via the native stack transition from Returning login (`/login` → "Other ways to log in").
- Both Back affordances call the route's single `onBack`, which is exactly `router.back()`; no progress state, key handling, or network work starts here.
- If recovery is later enabled, this route may become a real flow; the current copy must be revisited then, not softened now.

## States and failures

- Static unavailable state only; there is no loading, error, or success state because the route performs no I/O.
- The explanation is immediately readable and survives large text sizes via the shell scroll.

## Accessibility

- The header is the only heading; both truths are plain text in reading order.
- Back (48 dp) and Back to login (56 dp) are the only interactive elements; platform Back remains functional.
- Nothing relies on color or icon alone.

## Nostr and relay behavior

None. No signer change, key import, publish, subscription, or relay connection occurs on this route.

## QA strategy

- Component: `AccountRecoveryScreen.test.tsx` checks the unavailable-method and no-overwrite truths, the absence of fake recovery/provider actions, and both Back paths.
- Device: `maestro/flows/account-recovery.yaml` opens login, enters the route, asserts both truths, and captures the state.
- Scenario: `.qa/qa-account-recovery.mjs` provisions no relay, seeds one known
  device identity, exercises the unavailable route, returns through Login, and
  independently proves the exact seeded public key still unlocks with no
  profile/completion side effect before clearing app state.

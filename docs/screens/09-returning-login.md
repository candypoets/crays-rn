# 09 — Returning login

## Product and implementation contract

Returning login prioritizes device unlock when a valid protected local identity exists. It reads—but does not consume—the persisted entry context and resumes the exact invite or safe Discover destination after the signer is configured. Apple and Google are **not rendered as buttons**; provider login is stated as explanatory unavailable copy ("Provider login isn't configured — Apple and Google sign-in aren't available in this build."), so the screen never fakes provider authentication. "Other ways to log in" leads to the account-recovery unavailable state, which never overwrites a local key.

Visual authority: the Night Playlist entry/account board `docs/design-explorations/night-playlist/mockups/02-entry-and-account-v1.png`, **panel 08**, with the treatment notes in `docs/design-explorations/night-playlist/screens/09-returning-login.md`. Night Playlist supersedes the older `assets/screens` styling.

## Content and hierarchy

- Back (upper left) and the plum Crays mark (upper right).
- Decorative blue lock medallion (soft lilac ring, white ring, blue core) — an unlock cue, not a biometric claim.
- **Welcome back** header with **Pick up where you left off.** beneath it.
- Context truth: **Your invitation is saved while you unlock this account.** when an invite is preserved, otherwise **Unlock the Crays identity protected on this device.**
- One enabled primary action: **Unlock on this device** (disabled state reads **No account on this device** when no protected identity exists). No biometric affordance.
- Provider unavailability as static explanatory copy; no dead provider buttons.
- Quieter routes: **Other ways to log in** and **Create a new account**.

States: protected identity present; no device identity; invite context present; no context; protected storage read failure; signer unavailable; unlock in progress; unlock cancelled/error; success; and provider unavailable. No identity merge or entitlement move occurs here. Login only unlocks/restores the durable identity; it never joins a room or publishes visibility.

## Accessibility

- The header is the only heading; the medallion is hidden from screen-reader order.
- Unlock exposes button role with busy/disabled state; the disabled label itself explains the missing identity.
- Provider unavailability is plain text, readable at large type; all actions keep 48 dp targets and remain reachable while the error live region announces failures.

## Complete QA strategy

`.qa/qa-09-returning-login.mjs` uses a test-relay fixture key only through the development-only seed route, opens login, proves local unlock, honest provider-unavailability copy, and the destination. Invite-resume coverage chains screen 08 → login → screen 08 without losing token/service/room values. Unit tests cover provider unavailability, missing identity, local unlock callback, preserved-context copy, and recovery/create alternatives. Native QA must additionally background/relaunch at login and after unlock; the invite remains recoverable and the signer is reconfigured before any write. Release builds must not expose the seed route.

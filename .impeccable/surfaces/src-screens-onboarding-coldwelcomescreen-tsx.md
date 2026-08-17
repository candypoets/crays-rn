---
version: 1
slug: "src-screens-onboarding-coldwelcomescreen-tsx"
primary_target: "src/screens/onboarding/ColdWelcomeScreen.tsx"
related_targets: ["src/screens/onboarding/AccountAccessScreen.tsx","src/screens/onboarding/LoginScreen.tsx","src/screens/onboarding/AccountRecoveryScreen.tsx","src/screens/onboarding/ProfileSetupScreen.tsx","src/screens/onboarding/RecoveryScreen.tsx"]
---

Scope: Screens 06, 06B, 07, 07B, 09, and Existing Nostr identity; Operate mode with a persuasive first screen and a progressive custody handoff.

Audience/job: a first-time or returning guest, often in a dim and distracting venue context, either creates one understandable local identity or brings an existing Nostr identity without learning protocol vocabulary before taking action.

Action and proof: Create on this device or connect a signer (recommended), keep secret-key import advanced, choose the room-facing display name, understand the custody actually configured, then reach Discover. A signer-confirmed public key, valid nipworker-signed kind-0, and resumable protected descriptor prove completion.

Direction: inherit the canonical Crays Night Playlist artifacts. The memorable moment is the calm two-device handoff: one recommended signer action leads, the scannable request occupies the waiting state, and raw-key custody never competes visually with it.

Constraints: no username/password, Apple/Google provider theatre, automatic identity creation from a room, arbitrary profile relays, permission prompts, or fabricated account state. NIP-46 uses only configured discovery or signer-declared relays; secrets never enter copy, logs, or public view models. System Back, cancellation, text scaling, 48 dp targets, secure storage, and explicit interrupted/error states are mandatory.

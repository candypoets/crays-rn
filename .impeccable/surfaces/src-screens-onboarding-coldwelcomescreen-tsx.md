---
version: 1
slug: "src-screens-onboarding-coldwelcomescreen-tsx"
primary_target: "src/screens/onboarding/ColdWelcomeScreen.tsx"
related_targets: ["src/screens/onboarding/AccountAccessScreen.tsx","src/screens/onboarding/LoginScreen.tsx","src/screens/onboarding/AccountRecoveryScreen.tsx","src/screens/onboarding/ProfileSetupScreen.tsx","src/screens/onboarding/RecoveryScreen.tsx"]
---

Scope: the approved two-screen first run (Welcome → Create Crays ID), with existing-Nostr login as a secondary branch.

Audience/job: a first-time or returning guest, often in a dim and distracting venue context, either creates one understandable local identity or brings an existing Nostr identity without learning protocol vocabulary before taking action.

Action and proof: choose Create my Crays ID, provide one room-facing display name, then explicitly create the device-held identity, sign its local kind-0 profile, mark onboarding complete, and reach Tonight. Existing Nostr ID remains a clearly named secondary branch.

Direction: inherit the approved Night Playlist welcome and identity frames. The memorable moment is the plain-language commitment **Create ID and continue** after optional interests and a protected-on-device explanation.

Constraints: no username/password, Apple/Google provider theatre, automatic identity creation from a room, arbitrary profile relays, permission prompts, or fabricated account state. NIP-46 uses only configured discovery or signer-declared relays; secrets never enter copy, logs, or public view models. System Back, cancellation, text scaling, 48 dp targets, secure storage, and explicit interrupted/error states are mandatory.

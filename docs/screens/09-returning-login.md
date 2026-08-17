# 09 — Nostr login and returning unlock

## Product and implementation contract

Login has two honest states. A device with a validated saved identity gets **Welcome back** and one **Unlock on this device** action. A device without one gets **Log in with Nostr** and one **Use an existing Nostr identity** action leading to the NIP-46/import workflow. Crays never renders username/password, Apple, Google, or disabled provider theatre. The explanation **No Crays password** teaches that a Nostr signer proves identity ownership.

The route reads—but does not consume—the durable entry context. Unlock configures the stored local or NIP-46 signer and resumes the exact invitation or safe Discover destination. Login never generates an identity, joins a room, publishes visibility, or replaces stored custody.

Visual authority: Night Playlist board 02 panel 08. The blue lock medallion remains a device-unlock cue, not a biometric claim.

## Content, interaction, and states

- Back and Crays mark; decorative medallion hidden from accessibility.
- Existing identity: **Welcome back**, preserved-invitation truth when applicable, **Unlock on this device**, no-password explanation, and **Create a new account**.
- No identity: **Log in with Nostr**, signer/import summary, **Use an existing Nostr identity**, no-password explanation, quiet **Choose a login method**, and **Create a new account**.
- Protected-store loading/error, missing identity, invalid descriptor, native signer unavailable, local unlock, remote signer reconnect/timeout/rejection, and success all remain distinct.
- A remote identity restores its persisted bunker session and waits for the signer; a local identity decodes the protected nsec only at the manager boundary. The returned public key must match storage.

## Accessibility

The header is the only heading. The medallion is decorative. The active primary exposes busy/disabled state and a 56 dp target; errors use the shared alert live region. Copy and actions wrap under large text inside the safe-area-aware scroll shell.

## Complete QA strategy

`scenario:09-returning-login` seeds a deterministic development identity, opens Login, proves exact local unlock, no-password/provider absence, and Discover destination. Invite-resume coverage retains its context. Component tests cover existing and new-device branches and exact callbacks. Remote reconnect is covered at the account layer and must be included in the release NIP-46 smoke run described by `account-recovery.md`.

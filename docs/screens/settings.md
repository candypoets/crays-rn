# Profile, settings, and custody

## Product and implementation contract

Settings reports the validated signing method instead of assuming every identity owns a local key. A device-held or imported key shows **Protected on this device · Local** and its device-only storage consequence. A NIP-46 identity shows **Connected signer · NIP-46**, explains that Crays asks that signer to approve actions, and never implies that the user's secret key is stored here. **Existing Nostr identity** truthfully points out that signer connection and advanced import are available during login; Apple/Google/provider rows are absent.

The rest of Settings remains the operational privacy surface: persisted venue/global blocks with exact-scope unblock, per-room presence, request limits, notification state, custody-specific recovery copy, and room controls. This route reads only the public account summary and never exposes nsec or signer client credentials.

## States, interaction, and accessibility

- Custody: device-only, remote-signer, or protected-account read unavailable. Unknown never falls back to a false local-key claim.
- Blocks: loading, empty, populated local/venue scopes, storage failure, confirmation, removal, and conversation-refresh warning.
- All rows use text status plus badges, wrap at large type, and remain inside the safe-area-aware child shell. Read-only states have no false chevrons or switches. Unblock is the only mutation and is locked against repeat submits.

## QA

`scenario:settings` uses a deterministic device signer and asserts **Protected on this device**, **Existing Nostr identity**, notifications, privacy, and empty-block truth. `scenario:safety-blocks` covers exact-scope unblock and persistence. `SettingsScreen.test.tsx` additionally injects remote custody and requires **Connected signer · NIP-46** while forbidding device-key copy. Account-layer tests prove that the public summary never contains an nsec or NIP-46 client secret.

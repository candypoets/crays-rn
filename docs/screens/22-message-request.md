# 22 — Message request

## Product contract

The sender may write one ordinary editable message, maximum 240 characters. Until the recipient accepts or replies, the sender cannot send another request, message, or drink to that person. Starters are optional text substitutions, never a separate interaction format.

## UI and interaction

- Resolve recipient by pubkey from the active room; show name, intent, and live room context.
- Explain the one-message boundary before the composer.
- Starters populate the same editable field.
- Send is disabled for whitespace-only input and during publication.
- Confirmed state removes the composer and clearly says to wait.
- Recipient controls—Accept, Reply, Not now, Block, Report—are named before commitment.

## Protocol and privacy

The app publishes a standard kind-4 event through nipworker. Route code supplies the recipient `p` tag and a plaintext versioned envelope; nipworker performs NIP-04 encryption with the active signer and signs the encrypted event. Request type, room id/name, stable message id, reply linkage, and user text are all inside ciphertext. Local waiting state is committed only after the selected direct-message relay returns `OK`.

Independent QA queries the exact kind-4 event, validates its app-identity signature and sole recipient tag, proves the relay content is ciphertext, decrypts it with the fixture recipient secret, and checks exact plaintext, room context, type, and stable message id. The conversation lifecycle seeds a real incoming NIP-04 event and independently decrypts the app's acceptance and reply with exact encrypted linkage. Authenticated relay reads, multi-relay reconciliation, deletion, and migration remain production-hardening requirements.

## Required states

Empty, starter selected, edited, 240 characters, sending, relay OK, rejected, timeout, offline, recipient leaves, room expires, duplicate tap, pending request already exists, accepted conversation, recipient permits only mutuals, nobody, blocked/report state. Rejection preserves the draft. Success suppresses all repeat controls.

## Accessibility and safety

Character count and one-message restriction are text. Error and success use live accessibility roles. Suggested copy avoids coercive or romantic framing. Block and report cannot be hidden behind recipient acceptance.

## QA strategy

Unit coverage verifies starter editing, empty disablement, failure, and post-success suppression. `maestro/flows/22-message-request.yaml` reaches the screen from real signed profile/presence data and exercises a starter and count.

`.qa/qa-22-message-request.mjs` owns a complete isolated relay lifecycle and verifies all source fixtures. The publication extension must seed an authorized deterministic QA identity, send through the UI, query by sender and `#p`, verify the Nostr signature, decrypt with the fixture recipient key, assert exact plaintext and expiry, assert only one stored request after repeat input, then test relay false/timeout while confirming the draft remains.

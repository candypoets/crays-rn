# 22 — Message request

## Product contract

The sender may write one ordinary editable message, maximum 240 characters. Until the recipient accepts or replies, the sender cannot send another request, message, or drink to that person. Starters are optional text substitutions, never a separate interaction format.

Visual authority is the Night Playlist commerce/messages board
`docs/design-explorations/night-playlist/mockups/03-commerce-and-messages-v1.png`,
panel 05. The recipient’s portrait, name, and intent lead; no distance or online
claim is invented. The composer is one white sealed-note surface on the lilac
canvas rather than a stack of generic cards.

## UI and interaction

- Resolve recipient by pubkey from the active room; show name, intent, and the
  truthful “Met in this room” context without persisting a live/online claim.
- Explain the one-message boundary before the composer.
- Starters populate the same editable field.
- Send is a Commitment Coral action, disabled for whitespace-only input and
  during publication. Pending text reads **Sending request…** and the draft and
  character count remain visible.
- Confirmed state removes the composer and clearly says to wait.
- **Not right now** and Close return without publishing. Block and Report stay
  available on the originating person controls and the conversation screen;
  this screen does not render inert safety buttons without callbacks.

## Protocol and privacy

The app publishes a standard kind-4 event through nipworker. Route code supplies the recipient `p` tag and a plaintext versioned envelope; nipworker performs NIP-04 encryption with the active signer and signs the encrypted event. Request type, room id/name, stable message id, reply linkage, and user text are all inside ciphertext. Local waiting state is committed only after the selected direct-message relay returns `OK`.

The hosted Test Room's root-signed membership definition includes `permission=4,write` alongside profile, room-feed, and NIP-53 presence writes. Existing awards reference that addressable definition, so its latest valid replacement governs access. A Test Room member who entered visibly or quietly may therefore publish the same kind-4 request exercised by isolated QA; missing kind-4 capability must produce the relay rejection state and preserve the draft.

Independent QA queries the exact kind-4 event, validates its app-identity signature and sole recipient tag, proves the relay content is ciphertext, decrypts it with the fixture recipient secret, and checks exact plaintext, room context, type, and stable message id. The conversation lifecycle seeds a real incoming NIP-04 event and independently decrypts the app's acceptance and reply with exact encrypted linkage. Authenticated relay reads, multi-relay reconciliation, deletion, and migration remain production-hardening requirements.

## Required states

Empty, starter selected, edited, 240 characters, sending, relay OK, rejected, timeout, offline, recipient leaves, room expires, duplicate tap, pending request already exists, accepted conversation, recipient permits only mutuals, nobody, blocked/report state. Rejection preserves the draft. Success suppresses all repeat controls.

## Accessibility and safety

Character count and one-message restriction are text. Error and success use live accessibility roles. Suggested copy avoids coercive or romantic framing. Block and report cannot be hidden behind recipient acceptance.

## QA strategy

Unit coverage verifies starter editing, empty disablement, the 240-character
boundary, pending draft/count retention, failure, both exits, and post-success
suppression. `maestro/flows/22-message-request.yaml` reaches the screen from
real signed profile/presence data and exercises editable text and count.

`.qa/qa-22-message-request.mjs` owns a complete isolated relay lifecycle and verifies all source fixtures. The publication extension must seed an authorized deterministic QA identity, send through the UI, query by sender and `#p`, verify the Nostr signature, decrypt with the fixture recipient key, assert exact plaintext and expiry, assert only one stored request after repeat input, then test relay false/timeout while confirming the draft remains.

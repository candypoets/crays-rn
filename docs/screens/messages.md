# Messages and conversation

## Product + implementation contract

Messages is globally reachable and stores a protected local projection only after the NIP-04 kind-4 write is relay-confirmed, so the conversation remains navigable after leaving. Route code gives nipworker a plaintext kind-4 template; nipworker encrypts it with the active signer before signing and publishing. The relay-visible event contains only the standard recipient `p` tag. Request type, room context, stable message id, reply linkage, and user text live in the encrypted `life.crays/dm/v1` JSON envelope.

Conversation distinguishes outgoing **Waiting** from incoming **Request**; the sender cannot accept their own request. It subscribes to inbound and outbound kind-4 filters through nipworker and reads `Kind4Parsed.decryptedContent()` directly from the FlatBuffer callback. Accept publishes an encrypted `message-acceptance` envelope before unlocking the composer. Every reply publishes an encrypted `message` envelope referencing the prior stable message id. Block is immediately local and suppresses subsequently received messages from that person. Report publishes standard kind 1984 to the active venue relay.

The incoming kind-4 filter is the first request on a newly joined venue
connection. Public room families and the outgoing half open only after its
relay-scoped `ConnectionStatus("EOSE")`; the earlier cache EOSE is deliberately
ignored. Every requested relay must therefore prove that any NIP-42 challenge
was signed and the private request was replayed successfully. Authenticated
room-card reads acquire the same lease before their public query. Stable ids
include the relay-set scope, so matching consumers share the zero-copy buffer
without a different room replacing it. The room keeps that lease alive;
Messages copies only the minimal decrypted fields needed for durable local
navigation.

Visual authority is the Night Playlist commerce/messages board
`docs/design-explorations/night-playlist/mockups/03-commerce-and-messages-v1.png`,
panel 06, extended into the archive list. Portrait-led rows show the exact
person, durable room context, latest text, and textual request state. The
thread uses plum incoming and Signal Blue outgoing bubbles with no fabricated
online indicator, read receipt, or typing state.

## UI and interaction

- Messages remains useful with no active room. Empty and relay-error states may
  appear together because saved conversations remain readable.
- Each archive row is a single 48 dp-plus action and allows message copy and
  room context to reflow instead of truncating it.
- Incoming requests expose Accept and Not now; outgoing requests expose only
  the waiting consequence. The sender can never accept their own request.
- Accepted conversations expose the chronological thread, a 2,000-character
  keyboard-safe reply field, count, disabled empty state, and determinate
  **Sending…** lock.
- Block and Report remain labelled, reachable safety actions in every thread.
  Ignored and blocked states explain their local consequences.
- Back returns to the archive; no action restores expired room presence.

All states are textual and colors/icons are supplementary. Portraits have
names, errors use an announced banner, controls meet 48 dp, and the shell
scrolls under large type and the keyboard.

States: empty, outbound waiting, inbound requested, accepted, blocked, relay unavailable/rejected, report confirmed/rejected, no active venue, deleted local record, corrupt or temporarily unavailable protected storage, and recipient no longer visible. A blocked person cannot be requested or messaged again on that device. Setup or local-save failure on Messages home (identity, relay archive, local projection, or kind-4 subscription) surfaces an inline error banner above the archive instead of masquerading as “No conversations yet” or becoming an unhandled native promise. A conversation deep link whose pubkey matches no retained record renders a not-found state with a back action; it never spins indefinitely or opens another person's thread.

## Complete QA strategy

`.qa/qa-messages-home.mjs` sends through native UI and independently queries
the real room relay, verifies the kind-4 signature and minimal tags, proves
ciphertext excludes plaintext, decrypts with the fixture recipient key, and
validates the exact envelope. `.qa/qa-conversation.mjs` seeds an independently
encrypted/signed incoming kind-4 request, exercises native receive → accept →
reply → report, decrypts the acceptance and reply, validates their encrypted
reply chain, and verifies the kind-1984 report. Unit tests cover error+empty,
list/open/waiting, all consent/safety controls, ignored/blocked states, pending
locks, draft retention, reply gating, and maximum length. Production relays
carrying kind 4 must use authenticated reads because NIP-04 exposes
sender/recipient metadata and is not suitable for high-secrecy messaging.

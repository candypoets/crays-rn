# Messages and conversation

## Product + implementation contract

Messages is globally reachable and stores a protected local projection only after the NIP-04 kind-4 write is relay-confirmed, so the conversation remains navigable after leaving. Route code gives nipworker a plaintext kind-4 template; nipworker encrypts it with the active signer before signing and publishing. The relay-visible event contains only the standard recipient `p` tag. Request type, room context, stable message id, reply linkage, and user text live in the encrypted `life.crays/dm/v1` JSON envelope.

Conversation distinguishes outgoing **Waiting** from incoming **Request**; the sender cannot accept their own request. It subscribes to inbound and outbound kind-4 filters through nipworker and reads `Kind4Parsed.decryptedContent()` directly from the FlatBuffer callback. Accept publishes an encrypted `message-acceptance` envelope before unlocking the composer. Every reply publishes an encrypted `message` envelope referencing the prior stable message id. Block is immediately local and suppresses subsequently received messages from that person. Report publishes standard kind 1984 to the active venue relay.

States: empty, outbound waiting, inbound requested, accepted, blocked, relay unavailable/rejected, report confirmed/rejected, no active venue, deleted local record, corrupt storage, and recipient no longer visible. A blocked person cannot be requested or messaged again on that device.

## Complete QA strategy

`.qa/qa-messages-home.mjs` sends through native UI and independently queries the real room relay, verifies the kind-4 signature and minimal tags, proves ciphertext excludes plaintext, decrypts with the fixture recipient key, and validates the exact envelope. `.qa/qa-conversation.mjs` seeds an independently encrypted/signed incoming kind-4 request, exercises native receive → accept → reply → report, decrypts the acceptance and reply, validates their encrypted reply chain, and verifies the kind-1984 report. Unit tests cover envelope validation, relay persistence, empty/list/open, consent controls, and composer gating. Production relays carrying kind 4 must use authenticated reads because NIP-04 exposes sender/recipient metadata and is not suitable for high-secrecy messaging.

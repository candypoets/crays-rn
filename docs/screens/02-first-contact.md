# 02 — First contact

## Product contract

This screen is the consent boundary between seeing a visible room profile and contacting that person. **Message** is primary. **Send a drink** is secondary and explicitly non-anonymous. The person remains identified by pubkey and active-room projection, not by display name.

## UI and interaction

- Show display name, intent, one-line room context, and supplementary live state.
- Do not show distance, table, followers, popularity, or activity outside this room.
- Message opens screen 22 unless an accepted conversation already exists; accepted contacts open the thread directly.
- Send a drink opens screen 04 only after the recipient has accepted the NIP-04 conversation. A future signed recipient/venue gift-first policy may relax this conservative default (D-004).
- Back returns to the exact People state and filter position.

## State and data ownership

The route receives only `pubkey`. It resolves that identity from `RoomDataProvider`; a missing or expired person returns safely to People. It never carries a copied profile object through navigation. Room departure closes this screen because first-contact rights depend on the active-room credential.

Required states include active visible profile, profile disappearing while open, existing conversation, pending request, recipient blocks requests, gifting unavailable, and room expiry. No or pending relationship disables Send a drink; acceptance unlocks it.

## Accessibility and safety

Both actions are labelled buttons with minimum touch targets. The consent explanation is readable text, not a tooltip. Venue hide, global block, and venue report are one-tap actions here and remain reachable in the request/thread. The live dot is not the only evidence that the person is in this room.

## QA strategy

Unit coverage checks action hierarchy, the no-contact/pending gift lock, accepted-contact unlock, safety actions, and the non-anonymous contract. `maestro/flows/02-first-contact.yaml` enters an isolated relay-backed room, selects Jonas from actual presence/profile events, publishes a venue report, and verifies acknowledgement.

`.qa/qa-02-first-contact.mjs` creates and tears down its own test relay, validates fixture signatures, proves the person came from relay events, and independently checks the kind-1984 signer, venue, and target. `qa-safety-blocks.mjs` separately proves global/venue persistence, filtering, relaunch, unblock, and absence of DM or report side effects. Remote recipient policy/rate limits remain D-004.

# 02 — First contact

## Product contract

Canonical visual reference: `docs/design-explorations/night-playlist/mockups/01-room-and-feed-v1.png`, panel 04. The Night Playlist Maya sheet supersedes the incumbent dark profile PNG for composition and signal colors; consent and relay rules below remain authoritative.

This legacy profile-and-safety route is no longer exposed as a per-avatar overflow in People. A portrait now opens the shorter native message-request sheet directly, preserving the approved in-screen interaction and the room beneath it. The compatibility route remains addressable by exact pubkey for its existing gifting and safety contracts; it must never reintroduce three-dot controls over every portrait. **Message** remains available here, while **Send a drink** is secondary and explicitly non-anonymous. The person remains identified by pubkey and active-room projection, not by display name.

## UI and interaction

- When entered through a compatibility/development deep link, open as a portrait-led screen: the exact valid kind-0 picture already shown in People, or the same pubkey-derived bundled fallback, fills the hero. It never reselects an illustration from list position or display name. Follow with the text-labelled lime **In the room now** sticker, display name, intent, one-line room context, and room name.
- Do not show distance, table, followers, popularity, or activity outside this room.
- Message opens screen 22 unless an accepted conversation already exists; accepted contacts open the thread directly.
- Send a drink opens screen 04 only after the recipient has accepted the NIP-04 conversation. A future signed recipient/venue gift-first policy may relax this conservative default (D-004).
- **Browse quietly** is a visible outlined privacy action. Block and venue report live in the labelled overflow menu and remain one tap beyond opening it.
- Back returns to the exact People state and filter position. This route is not presented by an avatar ellipsis.

## State and data ownership

The route receives only `pubkey`. It resolves that identity from `RoomDataProvider`; a missing or expired person returns safely to People. It never carries a copied profile object through navigation. Room departure closes this screen because first-contact rights depend on the active-room credential.

Required states include active visible profile, profile disappearing while open, existing conversation, pending request, recipient blocks requests, gifting unavailable, and room expiry. No or pending relationship disables Send a drink; acceptance unlocks it.

## Accessibility and safety

All actions are labelled buttons with minimum 48-point touch targets. The consent explanation is readable text, not a tooltip. Venue hide is visible; global block and venue report remain reachable in the labelled overflow and in the request/thread. The text sticker—not a color-only live dot—states that the person is in this room.

Venue report publishing is owned by this route through nipworker `usePublish`.
The first `ok`/`true` confirms the report; `failed`/`false`/`error` displays the relay reason; timeout
and unmount stop the handle and restore the action.

## QA strategy

Unit coverage checks stable kind-0 image handoff, action hierarchy, the no-contact/pending gift lock, accepted-contact unlock, safety actions, and the non-anonymous contract. `maestro/flows/02-first-contact.yaml` enters an isolated relay-backed room, proves Jonas arrived from actual presence/profile events, then opens the compatibility route by exact fixture pubkey, publishes a venue report, and verifies acknowledgement. Screen 01/22 coverage separately proves that the production portrait path opens the native message-request sheet with no overflow control.

`scenario:02-first-contact` creates and tears down its own test relay, validates fixture signatures, proves the person came from relay events, and independently checks the kind-1984 signer, venue, and target. `scenario:safety-blocks` separately proves global/venue persistence, filtering, relaunch, unblock, and absence of DM or report side effects. Remote recipient policy/rate limits remain D-004.

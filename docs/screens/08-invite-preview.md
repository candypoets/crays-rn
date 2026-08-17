# 08 — Invite preview

## Product and implementation contract

This screen opens directly from an invite deep link, before authentication. It shows the room/operator identity, the exact membership grant, invite expiry, and award expiry when present. It persists `{serviceUrl, transportRelayUrl, roomId, token}` before handing off to account creation or login. Accepting never enters a room or publishes presence.

The token's base64url claims are untrusted display input until checked against `GET /community/info`. The client accepts only version 1, a future expiry, a valid kind-30009 badge address, a matching `required_badge`, and a definition author listed in the mirrored anchor (`admins` or `community_root`). The client deliberately says “issuer details match”; only `POST /redeem` verifies the service HMAC. The room card is independently read from the supplied Nostr relay and must pass the NIP-11 → kind-31727 → authorized kind-30312 projection.

Visual authority: the Night Playlist entry/account board `docs/design-explorations/night-playlist/mockups/02-entry-and-account-v1.png`, **panel 04**, with the treatment notes in `docs/design-explorations/night-playlist/screens/08-invite-preview.md`. Night Playlist supersedes the older dark styling.

## Content and hierarchy

- Back (upper left) and the plum Crays mark (upper right); Back preserves the invite context and never consumes it.
- Coral handwritten-style **You're invited!** cue (decorative, real text).
- **A room is waiting for you** — the header.
- White invite card: **Verified by** row (rosette, issuer/room name, circular venue image when the signed room card has loaded), the **Room** name and about line, then the exact **Grant** (Room membership) and **Expires** (locale-formatted claims expiry) side by side. Event id, issuer, relay, and expiry are data, not decorative labels.
- Shield note, verbatim: **Issuer details match this invitation. The venue proves the server signature only when you accept it.** — verification is scoped to issuer details; the server signature is proven only at redeem time.
- One action: **Accept invite** with a local identity, otherwise **Create account to accept** plus the quieter **I already have an account**. No separate Keep-invite action exists because the route exposes no such callback; Back carries return semantics.
- Truth line: **Accepting grants membership. It never makes you visible or joins the live room.**

States: initial/loading (quiet indicator, no fake grant); issuer reachable and signed room loaded; issuer valid while room is still loading; offline with retry; malformed; expired; badge mismatch; issuer mismatch; no local identity; local identity ready; redeeming; redemption limit/used; and retryable service failure. Back preserves the invite context; cancel does not consume it.

## Accessibility

- The header is the only heading; the cue, rosette, and venue image are decorative (the image carries a venue label).
- Grant, expiry, and issuer state are plain text in reading order; the single action exposes busy/disabled while redeeming.
- Loading and retry keep 48 dp targets; large text scrolls to the action.

## Complete QA strategy

`.qa/qa-08-invite-preview.mjs` creates an isolated Nuts coordinator relay, asks its real invite service to mint a token through an admin NIP-98 request, and publishes the signed room fixture. Maestro opens the public deep link and proves issuer, room, grant, expiry path, account-required CTA, and no premature success. Independent relay verification checks all fixture signatures. Teardown deletes the exact relay/volume and app data.

Unit coverage rejects missing signatures, malformed claims, unsupported versions, expired tokens, invalid badges, mismatched badges, mismatched issuers, non-HTTP services, failed community info, and unavailable issuer responses. UI coverage exercises loading, retry, create-account handoff, returning-login handoff, accept-ready, and the explicit no-presence copy. A release build must redirect `/qa-seed`; it is never a production identity import path.

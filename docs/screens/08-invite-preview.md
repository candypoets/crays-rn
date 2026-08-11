# 08 — Invite preview

## Product and implementation contract

This screen opens directly from an invite deep link, before authentication. It shows the room/operator identity, the exact membership grant, invite expiry, and award expiry when present. It persists `{serviceUrl, transportRelayUrl, roomId, token}` before handing off to account creation or login. Accepting never enters a room or publishes presence.

The token's base64url claims are untrusted display input until checked against `GET /community/info`. The client accepts only version 1, a future expiry, a valid kind-30009 badge address, a matching `required_badge`, and a definition author listed in the mirrored anchor (`admins` or `community_root`). The client deliberately says “issuer details match”; only `POST /redeem` verifies the service HMAC. The room card is independently read from the supplied Nostr relay and must pass the signed manifest projection.

States: initial/loading; issuer reachable and signed room loaded; issuer valid while room is still loading; offline with retry; malformed; expired; badge mismatch; issuer mismatch; no local identity; local identity ready; redeeming; redemption limit/used; and retryable service failure. Back preserves the invite context; cancel does not consume it.

## Complete QA strategy

`.qa/qa-08-invite-preview.mjs` creates an isolated Nuts coordinator relay, asks its real invite service to mint a token through an admin NIP-98 request, and publishes the signed room fixture. Maestro opens the public deep link and proves issuer, room, grant, expiry path, account-required CTA, and no premature success. Independent relay verification checks all fixture signatures. Teardown deletes the exact relay/volume and app data.

Unit coverage rejects missing signatures, malformed claims, unsupported versions, expired tokens, invalid badges, mismatched badges, mismatched issuers, non-HTTP services, failed community info, and unavailable issuer responses. UI coverage exercises loading, retry, create-account handoff, returning-login handoff, accept-ready, and the explicit no-presence copy. A release build must redirect `/qa-seed`; it is never a production identity import path.

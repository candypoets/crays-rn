# 08B — Invite accepted

## Product and implementation contract

Success appears only after the real invite service returns a 64-character award event id. The client stores the result by invite nonce plus account pubkey before navigation, so double taps, re-rendering, background/relaunch, and a repeated link reuse the same result rather than calling `/redeem` again. The screen names the durable membership, venue, and abbreviated signed award id. Membership detail is primary; room preview is secondary and remains an explicit join/visibility flow.

Failures never render this screen. Ownership is bound to the account used at redemption; switching accounts requires returning before redemption. The accepted screen never publishes presence, starts a room subscription, or implies physical access.

## Complete QA strategy

`.qa/qa-08b-invite-accepted.mjs` provisions a real Nuts relay and invite service, configures a deterministic development-only signer through `/qa-seed`, accepts through public UI, and independently queries the room relay for kind 8. The verifier requires the exact invite nonce, recipient pubkey, badge address, issuer signature, and a valid Nostr signature. Maestro asserts durable-grant language and no-visibility language. Repeat-tap and relaunch unit cases assert one HTTP request and stored-result reuse; server-expired, exhausted, offline, invalid event-id, and storage-failure paths remain on preview with retry. `.qa/qa-08b-invite-redeemed-twice.mjs` proves the idempotency end to end: redeeming the same token twice through the public UI leaves exactly one issuer kind-8 award for the nonce on the relay and exactly one redemption marker. Exact relay/app teardown is mandatory.

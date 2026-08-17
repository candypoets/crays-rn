# 08B — Invite accepted

## Product and implementation contract

Success appears only after the real invite service returns a 64-character award event id. The client stores the result by invite nonce plus account pubkey before navigation, so double taps, re-rendering, background/relaunch, and a repeated link reuse the same result rather than calling `/redeem` again. The screen names the durable membership, venue, and abbreviated signed award id. Membership detail is primary; room preview is secondary and remains an explicit join/visibility flow.

Failures never render this screen. Ownership is bound to the account used at redemption; switching accounts requires returning before redemption. The accepted screen never publishes presence, starts a room subscription, or implies physical access.

Visual authority: the Night Playlist entry/account board `docs/design-explorations/night-playlist/mockups/02-entry-and-account-v1.png`, **panel 04 settled variant**, with the treatment notes in `docs/design-explorations/night-playlist/screens/08b-invite-accepted.md`. Night Playlist supersedes the older dark styling.

## Content and hierarchy

- Settled check medallion (soft lilac ring, white ring, blue core) — decorative, hidden from screen-reader order. No Back affordance exists on this route.
- **Invite accepted** stage label, then the header **You're on the list.**
- Ownership truth: the membership at the named venue belongs to this Crays account and remains available after the room closes.
- Grant card: **Granted → Room membership**, venue name, and the abbreviated signed award id (`Signed award · first 12 chars…`). The id is data, not decoration.
- Next decision: **View membership** (primary, durable detail route) and **Continue to room preview** (secondary, explicit join/visibility flow).
- Explicit presence truth: **You are not visible in the room.** — presence and visibility have not started; the screen never says "you are in the room" until the separate join contract completes.

## Accessibility

- Accepted state, grant, and award id are plain text in reading order; the medallion and eye-off icon are decorative.
- Both actions keep 48 dp targets; large text scrolls to the actions.
- No fake room state is rendered before or after the decision.

## Complete QA strategy

`scenario:08b-invite-accepted` provisions a real Nuts relay and invite service, configures a deterministic development-only signer through `/qa-seed`, accepts through public UI, and independently queries the room relay for kind 8. The verifier requires the exact invite nonce, recipient pubkey, badge address, issuer signature, and a valid Nostr signature. Maestro asserts durable-grant language and no-visibility language. Repeat-tap and relaunch unit cases assert one HTTP request and stored-result reuse; server-expired, exhausted, offline, invalid event-id, and storage-failure paths remain on preview with retry. `scenario:08b-invite-redeemed-twice` proves the idempotency end to end: redeeming the same token twice through the public UI leaves exactly one issuer kind-8 award for the nonce on the relay and exactly one redemption marker. Exact relay/app teardown is mandatory.

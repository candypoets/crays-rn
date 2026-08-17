# 19 — Membership detail

## Product + implementation contract

Detail distinguishes an available offer from owned access. Ownership requires a kind-8 award for the definition and local pubkey, signed by an anchor admin or the anchor's badge_issuer. The white scanner card contains a real holder-signed kind-27236 payload with a 90-second expiry and 60-second refresh. Memberships and passes use a fresh `use:` fulfillment context. Staff activity remains relay truth; renewal/payment remains off and nothing auto-charges.

Visual authority is the Night Playlist durable/settings board
`docs/design-explorations/night-playlist/mockups/04-durable-and-settings-v1.png`,
panel 05. Status leads over a venue image, followed by validity/remaining uses,
presentation, the published benefit description, trusted activity, and
management. Protocol vocabulary stays out of the customer hierarchy.

## Interaction and accessibility

- Back meets 48 dp and returns to the invoking archive/offer path.
- Active/available owned access mounts the live presentation owner. Invalid
  state retains the durable record and reason while explicitly removing
  door-ready wording.
- Offer-only state shows price/cadence and the unconfigured-purchase truth with
  no presentation.
- Remaining uses and every activity state are text. The UI never decrements a
  local counter or invents a benefit.
- Status, image, and icons are supplementary to reflowing text; large content
  remains scrollable.

States: Active, Action needed, Paused, Expires soon, Expired, Revoked, Cancelled; pass Available/Exhausted; QR refreshing/offline/expired; no activity; and offer-only. Status always appears in text. A route `awardId` that matches no owned award renders the offer-only state; another identity's or another award's record is never substituted.

## Complete QA strategy

`scenario:19-membership-detail` opens the exact issuer-signed membership
award from an isolated relay. `verify-presentation.mjs` decodes the logged QR
payload and independently verifies signature, kind/type, exact award,
authoritative relay, nonce, single context, and lifetime. `scenario:memberships`
adds a three-use pass with one fulfilled context and proves **2 of 3 uses
remaining** plus its activity. Component tests cover active, revoked,
offer-only, remaining-use, and activity states; pure tests cover
latest-per-context rollback, exhaustion, expiry, and revocation precedence.
Scanner-role/replay/iOS work is D-010/D-011.

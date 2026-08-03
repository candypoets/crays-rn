# 19 — Membership detail

## Product + implementation contract

Detail distinguishes an available offer from owned access. Ownership requires a kind-8 award for the definition and local pubkey, signed by the award issuer in the room manifest. The white scanner card contains a real holder-signed kind-27236 payload with a 90-second expiry and 60-second refresh. Memberships and passes use a fresh `use:` fulfillment context. Staff activity remains relay truth; renewal/payment remains off and nothing auto-charges.

States: Active, Action needed, Paused, Expires soon, Expired, Revoked, Cancelled; pass Available/Exhausted; QR refreshing/offline/expired; no activity; and offer-only. Status always appears in text. A route `awardId` that matches no owned award renders the offer-only state; another identity's or another award's record is never substituted.

## Complete QA strategy

`.qa/qa-19-membership-detail.mjs` opens the exact issuer-signed membership award from an isolated relay. `verify-presentation.mjs` decodes the logged QR payload and independently verifies signature, kind/type, exact award, authoritative relay, nonce, single context, and lifetime. `qa-memberships.mjs` adds a three-use pass with one fulfilled context and proves **2 of 3 uses remaining** plus its activity. Unit tests cover latest-per-context rollback, exhaustion, expiry, and revocation precedence. Scanner-role/replay/iOS work is D-010/D-011.

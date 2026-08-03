# 18 — Membership offer

## Product + implementation contract

The active venue's operator-signed kind-30009 `type=membership` definition supplies name, description, price/currency, cadence, and availability. The surface states concrete benefits, identity ownership, renewal consequences, and cancellation terms before acquisition. Because payment rails are explicitly deferred, its purchase CTA is disabled and no award, charge, renewal, or optimistic membership is created; payment methods may be inspected without commitment.

States cover available, unavailable, stale/replaced definition, no offer, multiple tiers, eligibility restriction, payment unconfigured, payment failed/action needed, and offline. A future checkout must re-query the current definition and preserve the original intent. A route `id` that matches no published definition shows the no-offer state; the first offer is never substituted.

## Complete QA strategy

`.qa/qa-18-membership-offer.mjs` consumes a real operator-signed definition, verifies it independently, and asserts price/cadence plus the no-side-effect payment state. Unit tests require the disabled CTA. Future payment contract QA must verify exactly one payment redemption and kind-8 award, interrupted handoff reconciliation, decline/cancel, replacement pricing, and no award when disabled.

# 18 — Membership offer

## Product + implementation contract

The active venue's anchor-admin-signed kind-30009 `t=membership` definition supplies name, description, NIP-99 price/currency with cadence in the price tag's fourth element, and availability. The surface states concrete benefits, identity ownership, renewal consequences, and cancellation terms before acquisition. Because payment rails are explicitly deferred, its purchase CTA is disabled and no award, charge, renewal, or optimistic membership is created; payment methods may be inspected without commitment.

Visual authority is the Night Playlist durable/settings board
`docs/design-explorations/night-playlist/mockups/04-durable-and-settings-v1.png`,
panel 05. A venue-image hero contains only definition-backed name,
availability, price, and recurrence. The body repeats the published description
and operational billing/identity facts; it does not invent a generic perks
list when the definition has no structured benefits.

## Interaction and accessibility

- Back and **Review payment methods** are 48 dp actions.
- **Membership checkout not configured** is visibly and semantically disabled;
  unavailable definitions receive their own disabled label.
- Reviewing payment methods does not select, charge, issue, or navigate to a
  success state.
- A missing exact route ID renders **No membership offer** and no purchase
  control.
- Long names/descriptions reflow, availability is textual, and imagery is
  labelled but supplementary.

States cover available, unavailable, stale/replaced definition, no offer, multiple tiers, eligibility restriction, payment unconfigured, payment failed/action needed, and offline. A future checkout must re-query the current definition and preserve the original intent. A route `id` that matches no published definition shows the no-offer state; the first offer is never substituted.

## Complete QA strategy

`scenario:18-membership-offer` consumes a real anchor-admin-signed
definition, verifies it independently, and asserts price/cadence plus the
no-side-effect payment state. Unit tests cover the exact published description,
price/cadence, disabled CTA, payment-method callback, absent invented perks,
and missing-ID state. Future payment contract QA must verify exactly one
payment redemption and kind-8 award, interrupted handoff reconciliation,
decline/cancel, replacement pricing, and no award when disabled.

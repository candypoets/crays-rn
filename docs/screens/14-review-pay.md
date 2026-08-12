# 14 — Review and pay

## Product contract

Review is the final, fiat-first truth before a charge. It shows venue, every
line and recipient, editable quantities, included taxes/fees, total, and the
selected payment preference. The primary action opens the hosted Stripe
checkout provided by the shared Nuts payment service; it never collects card
data inside the native app.

The current payment-service contract accepts one self-order line at quantity
one: `{ community, eventAddress, returnTo }` plus a kind-27235 NIP-98
Authorization header. The signed community relay URL is sent as `community`,
not a local transport proxy. Gift orders, Cashu wallet checkout, and carts with
multiple lines or quantities are explicit disabled states until their payment
contracts exist.

## Data and reconciliation

Cart is local operational state; live kind-30402 listings remain price and
availability authority. The payment service independently resolves the same
address from the community relay before creating a Stripe Session. After Stripe
confirms payment, its webhook calls the room's payment redemption endpoint,
which publishes the badge-issuer-signed kind-8 product award. Crays only treats
the order as confirmed after that award is observed on the active relay and
derives its status from kind 37237.

Opening the hosted page is not payment success. If the browser returns before
the award arrives, show the pending/reconciliation state and suppress a second
attempt until the user deliberately retries from the review surface.

## Paths

Valid one-line self cart, empty cart, self/gift mix, quantity edit/removal,
different-room cart, item unavailable, price drift, method selection, no
connected Stripe account, payment page opened, payment cancelled, failed,
uncertain, succeeded awaiting kind-8 award, award confirmed, and refund
pending/refunded. The browser handoff and relay-confirming branches are the
normal path; unsupported cart shapes remain actionable explanations rather
than silently charging a different amount.

## QA strategy

Unit coverage asserts total, the one-line checkout guard, NIP-98 request
construction, browser-open state, request errors, and award reconciliation.
`maestro/flows/14-review-pay.yaml` builds a self cart from the live relay,
opens the hosted checkout adapter, and waits for the signed award to appear.
Run that scenario with Metro started using
`EXPO_PUBLIC_PAYMENT_SERVICE_URL=http://10.0.2.2:8790 npm run start:maestro`.
`.qa/qa-14-review-pay.mjs` provisions the real coordinator/relay contract,
uses the checkout contract's deterministic QA adapter to perform the real
payment redemption, and independently queries the relay for the new award and
its order reference before teardown. No UI success text or in-memory cart is
protocol proof.

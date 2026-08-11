# 14 — Review and pay

## Product contract

Review is the final, fiat-first truth before a charge. It shows venue, every line and recipient, editable quantities, included taxes/fees, total, and selected payment method. The commitment CTA must name the charge amount only when a real rail is configured.

Apple Pay, Google Pay, and card/Stripe are explicitly deferred by product direction. Wallet payment is also not simulated without spendable proofs. This implementation therefore disables commitment and states that no charge or order will be created. It must never show a success, order number, or receipt from a local-only tap.

## Data and reconciliation

Cart is local operational state; live kind-30402 listings remain price/availability authority. Before enabling future payment, compare every address, price, currency, and availability. Once a rail reports payment but venue award is uncertain, enter **Confirming with the venue** and suppress all second-pay actions until reconciliation.

## Paths

Valid cart, empty cart, self/gift mix, quantity edit/removal, different-room cart, item unavailable, price drift, method selection, no configured methods, payment cancelled, failed, uncertain, succeeded awaiting kind-8 award, refund pending/refunded. Current pilot covers the honest no-rail branch.

## QA strategy

Unit coverage asserts total and disabled honest payment. `maestro/flows/14-review-pay.yaml` builds a cart from a relay definition and verifies exact total plus deferred-payment copy. `.qa/qa-14-review-pay.mjs` verifies signed source data and cleanup. Future rail QA must use provider/mint sandboxes, deterministic idempotency keys, one charge after repeated taps, app-background return, price drift rejection, award reconciliation, and no second CTA while uncertain.

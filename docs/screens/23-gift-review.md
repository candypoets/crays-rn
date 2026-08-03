# 23 — Gift review

## Product contract

Gift review separates purchaser, recipient, private message/ticket delivery, recipient acceptance, venue fulfillment, and refund. It shows the exact item, quantity, fiat total, named recipient, and selected payment method. Gifts are never anonymous.

The recipient may decline before fulfillment. Refund follows the original rail and may transition through **Refund pending**. The screen never promises instant refund or exposes recipient location.

Payments are deferred in this pilot, so commitment is disabled and no kind-8 award, gift message, or venue order is fabricated. When enabled, one payment must reconcile to one purchase award and the same order status ladder as self-orders.

## Paths and QA

Valid review, recipient leaves, item unavailable, price changes, method unavailable, cancelled handoff, payment failure/uncertainty/success, message delivery pending, recipient accept/decline, venue cancelled, refund pending/refunded, duplicate tap. Unit coverage asserts the separated contract and disabled payment. `maestro/flows/23-gift-review.yaml` creates the gift cart from real relay data and checks ticket and refund copy. `.qa/qa-23-gift-review.mjs` verifies fixture signatures/projections and exact teardown; future payment sandbox tests must prove idempotent award and decline/refund behavior.

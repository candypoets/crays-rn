# 23 — Gift review

## Product contract

Gift review separates purchaser, recipient, private message/ticket delivery, recipient acceptance, venue fulfillment, and refund. It shows the exact item, quantity, fiat total, named recipient, and selected payment method. Gifts are never anonymous.

The recipient may decline before fulfillment. Refund follows the original rail and may transition through **Refund pending**. The screen never promises instant refund or exposes recipient location.

Payments are deferred in this pilot, so commitment is disabled and no kind-8 award, gift message, or venue order is fabricated. When enabled, one payment must reconcile to one purchase award and the same order status ladder as self-orders.

Visual authority: the Night Playlist commerce/messages board `docs/design-explorations/night-playlist/mockups/03-commerce-and-messages-v1.png`, **panel 07**, with the treatment notes in `docs/design-explorations/night-playlist/screens/23-gift-review.md`. Night Playlist supersedes the older dark styling.

## Content and hierarchy

- App shell header: plum mark, Gift order eyebrow, **Send a drink to {recipient}** title, tempo rail, and a shared recipient illustration with the lime gift ring at right. Only the recipient name and pubkey from the cart line are real identity data. A line missing either renders **Gift unavailable**, offers a route back to person selection, and omits all payment controls; gifts are never anonymous or silently treated as self-orders.
- **Choose another drink** return link.
- Item card: shared drink imagery, the line's exact name, **Quantity {n} · from you**, and the exact line total. No note or modifiers render because no such data exists in props.
- Lime fulfillment box, verbatim: **The bar receives a normal order. {recipient} receives a private message and claim ticket.**
- Decline/refund box, verbatim: **They may decline before fulfillment. Refund follows the original payment rail and may show Refund pending first.**
- **Payment method** row with Change; it opens the method child route and never charges.
- Deferred banner, verbatim: **Payment is intentionally deferred in this pilot. No order or gift ticket is created.**
- The commitment-shaped control is disabled and reads **Payment unavailable · {exact total}** — a statement, not a button. No send-gift or decline action exists on this screen in this build.

## Accessibility

- The header carries the recipient's name as text; the portrait is labelled, the fulfillment/refund truths are plain text in reading order.
- The method row exposes a button role; the disabled commitment reports its disabled state.
- All interactive targets are 48 dp; large text scrolls to every consequence line.

## Paths and QA

Valid review, recipient leaves, item unavailable, price changes, method unavailable, cancelled handoff, payment failure/uncertainty/success, message delivery pending, recipient accept/decline, venue cancelled, refund pending/refunded, duplicate tap. Unit coverage asserts the separated contract, missing-recipient rejection, exact total, method/back callbacks, and disabled payment. `maestro/flows/23-gift-review.yaml` creates the gift cart from real relay data and checks ticket and refund copy. `.qa/qa-23-gift-review.mjs` verifies fixture signatures/projections and exact teardown; future payment sandbox tests must prove idempotent award and decline/refund behavior.

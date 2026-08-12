# 14 — Review and pay

## Product contract

Review is the final, fiat-first truth before a charge. It shows venue, every line and recipient, editable quantities, included taxes/fees, total, and selected payment method. The commitment CTA must name the charge amount only when a real rail is configured.

Apple Pay, Google Pay, and card/Stripe are explicitly deferred by product direction. Wallet payment is also not simulated without spendable proofs. This implementation therefore disables commitment and states that no charge or order will be created. It must never show a success, order number, or receipt from a local-only tap.

Visual authority: the Night Playlist commerce/messages board `docs/design-explorations/night-playlist/mockups/03-commerce-and-messages-v1.png`, **panel 03**, with the treatment notes in `docs/design-explorations/night-playlist/screens/14-review-pay.md`. Night Playlist supersedes the older dark styling.

## Content and hierarchy

- App shell header: plum mark, venue eyebrow, **Review and pay** title, tempo rail; **Keep ordering** return link.
- **Order** section: one white card per cart line with name, recipient (**For {name}** / **For me**), exact line total, a 48 dp quantity stepper, and Remove. Quantity edits and removals go straight to the cart callbacks with the line's product id and recipient; a quantity reduced below 1 is handed to the cart (removal semantics live there, not on screen). **Add another item** returns to the menu via the same Back callback.
- Totals card: Subtotal, **Taxes and fees — Included**, then the bold **Total**.
- **Payment method** row opens the child route and returns with the chosen method; it never charges.
- Honest deferral banner, verbatim: **Payments are intentionally not connected in this pilot. No charge or venue order will be created from this build.**
- The one commitment-shaped control is disabled and reads **Payment unavailable · {total}** — a statement, not a button. There is no place-order success path in this build.

## Data and reconciliation

Cart is local operational state; live kind-30402 listings remain price/availability authority. Before enabling future payment, compare every address, price, currency, and availability. Once a rail reports payment but venue award is uncertain, enter **Confirming with the venue** and suppress all second-pay actions until reconciliation.

## Paths

Valid cart, empty cart, self/gift mix, quantity edit/removal, different-room cart, item unavailable, price drift, method selection, no configured methods, payment cancelled, failed, uncertain, succeeded awaiting kind-8 award, refund pending/refunded. Current pilot covers the honest no-rail branch.

## Accessibility

- Line names, recipients, quantities, and totals are plain text; steppers carry per-line labels and 48 dp targets.
- The method row exposes a button role; the disabled commitment reports its disabled state and reads as a status, not an action.
- The deferral truth is text in reading order, not color or icon alone.

## QA strategy

Unit coverage asserts total, mixed-recipient line routing, quantity boundaries, empty cart, and disabled honest payment. `maestro/flows/14-review-pay.yaml` builds a cart from a relay definition and verifies exact total plus deferred-payment copy. `.qa/qa-14-review-pay.mjs` verifies signed source data and cleanup. Future rail QA must use provider/mint sandboxes, deterministic idempotency keys, one charge after repeated taps, app-background return, price drift rejection, award reconciliation, and no second CTA while uncertain.

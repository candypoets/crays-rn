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

Visual authority: the Night Playlist commerce/messages board `docs/design-explorations/night-playlist/mockups/03-commerce-and-messages-v1.png`, **panel 03**, with the treatment notes in `docs/design-explorations/night-playlist/screens/14-review-pay.md`. Night Playlist supersedes the older dark styling.

## Content and hierarchy

- App shell header: plum mark, venue eyebrow, **Review and pay** title, tempo rail; **Keep ordering** return link.
- **Order** section: one white card per cart line with name, recipient (**For {name}** / **For me**), exact line total, a 48 dp quantity stepper, and Remove. Quantity edits and removals go straight to the cart callbacks with the line's product id and recipient; a quantity reduced below 1 is handed to the cart (removal semantics live there, not on screen). **Add another item** returns to the menu via the same Back callback.
- Totals card: Subtotal, **Taxes and fees — Included**, then the bold **Total**.
- **Payment method** row opens the child route and returns with the chosen method; it never charges.
- The secure-browser banner explains that Stripe owns payment entry and that a
  room order appears only after a signed product award reaches the relay.
- The one commitment action reads **Continue to Stripe · {total}**. It is
  enabled only for the supported one-line, quantity-one self order, disabled
  during request/browser-open states, and accompanied by visible guard or
  request errors when checkout cannot begin.

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

## Accessibility

- Line names, recipients, quantities, and totals are plain text; steppers carry per-line labels and 48 dp targets.
- The method row and checkout control expose button roles and disabled states;
  progress is announced without relying on color or icon alone.
- Hosted-payment, unsupported-cart, request-error, and browser-open truth is
  text in reading order.

## QA strategy

Unit coverage asserts totals, mixed-recipient line routing, quantity boundaries,
empty-cart behavior, the one-line checkout guard, NIP-98 request construction,
browser-open state, request errors, and award reconciliation.
`maestro/flows/14-review-pay.yaml` builds a self cart from the live relay,
opens the hosted checkout adapter, and waits for the signed award to appear.
Run that scenario with Metro started using
`EXPO_PUBLIC_PAYMENT_SERVICE_URL=http://10.0.2.2:8790 npm run start:maestro`.
`scenario:14-review-pay` provisions the real coordinator/relay contract,
uses the checkout contract's deterministic QA adapter to perform the real
payment redemption, and independently queries the relay for the new award and
its order reference before teardown. No UI success text or in-memory cart is
protocol proof.

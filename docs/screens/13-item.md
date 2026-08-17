# 13 — Item configuration

## Product contract

Item configuration exposes every quantity, modifier, recipient, fulfillment, and price consequence before cart commitment. The route carries only a product event ID and optional recipient pubkey; both are re-resolved from the current room projection.

The pilot fixtures publish no modifiers, so the screen states **Prepared as listed** instead of fabricating choices. Quantity is 1–20. Recipient is either **Me** or a current visible/known person. The CTA states the exact current total.

Visual authority: the Night Playlist commerce/messages board `docs/design-explorations/night-playlist/mockups/03-commerce-and-messages-v1.png`, **panel 02**, with the treatment notes in `docs/design-explorations/night-playlist/screens/13-item.md`. Night Playlist supersedes the older dark styling.

## Content and hierarchy

- App shell header: plum mark, room eyebrow, product name as title, tempo rail; **Menu** return link.
- One hero moment: shared drink imagery (deterministic atlas index from product position; honest icon block for non-drink kinds), then the venue-authored description.
- **Unit price** (exact, formatted) and **For** (recipient or **Me**) side by side.
- **Prepared as listed**: this venue has not published modifiers for this item; the final review rechecks price and availability. No priced options are invented while no modifier data exists; if a modifiers contract lands, only actual supported modifiers may render.
- **Quantity** stepper (1–20) with explicit labels.
- The one action: **Add to order · {exact total}** — it mutates local cart through the route callback only, then returns; it never implies venue acceptance. Unavailable items or an in-progress add disable it; failures keep the screen and selection.

## State and validation

Available, unavailable while open, removed definition, price changed, malformed definition, self order, gift order, quantity boundaries, add in progress, local persistence failure, room expiry, recipient leaves, and cart replacement from another venue. Revalidate product and recipient immediately before adding; failure keeps the screen and selection.

## Accessibility

Quantity controls have explicit labels and 48dp targets. Price and recipient are written, not inferred from iconography. Dynamic totals announce as text after quantity changes; errors render in an alert role. The hero image carries the product name as its label.

## QA strategy

Unit coverage verifies quantity, boundaries, exact total, unavailable/pending locking, and error display. `maestro/flows/13-item.yaml` resolves a signed product from the isolated relay, changes quantity, and checks the updated commitment. `scenario:13-item` independently validates the complete relay fixture family and projection. Add tests for min/max, rapid taps, unavailable transition, stale price, recipient departure, storage failure, background/restore, and room expiry.

# 13 — Item configuration

## Product contract

Item configuration exposes every quantity, modifier, recipient, fulfillment, and price consequence before cart commitment. The route carries only a product event ID and optional recipient pubkey; both are re-resolved from the current room projection.

The pilot fixtures publish no modifiers, so the screen states **Prepared as listed** instead of fabricating choices. Quantity is 1–20. Recipient is either **Me** or a current visible/known person. The CTA states the exact current total.

## State and validation

Available, unavailable while open, removed definition, price changed, malformed definition, self order, gift order, quantity boundaries, add in progress, local persistence failure, room expiry, recipient leaves, and cart replacement from another venue. Revalidate product and recipient immediately before adding; failure keeps the screen and selection.

## Accessibility

Quantity controls have explicit labels and 48dp targets. Price and recipient are written, not inferred from iconography. Dynamic totals announce as text after quantity changes.

## QA strategy

Unit coverage verifies quantity and exact total. `maestro/flows/13-item.yaml` resolves a signed product from the isolated relay, changes quantity, and checks the updated commitment. `.qa/qa-13-item.mjs` independently validates the complete relay fixture family and projection. Add tests for min/max, rapid taps, unavailable transition, stale price, recipient departure, storage failure, background/restore, and room expiry.

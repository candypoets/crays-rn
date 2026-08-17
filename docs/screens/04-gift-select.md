# 04 — Select a gifted drink

## Product contract

Canonical visual references: `docs/design-explorations/night-playlist/mockups/03-commerce-and-messages-v1.png`, panel 07, for the pinned recipient/product framing; and `01-room-and-feed-v1.png`, panel 05, for the **Pick the next track** selection language. This route remains the eligible-product selection step, so it does not render the later note, review, or send commitment prematurely.

This screen chooses an eligible drink for one known room identity. It is a social venue order, never an anonymous transfer. It states: the bar gets the order, the named recipient gets the ticket, and they may decline before fulfillment.

Resolve recipient by pubkey from current room data and require a locally retained, accepted NIP-04 conversation. The route repeats this authorization check, so a deep link cannot bypass the consent gate. If the consent read itself fails, the route fails closed back to the room profile rather than hanging on the consent check. Filter operator-signed products to `availability=available` and `product_kind=drink`; food and unrelated catalog records are excluded. Selection opens the normal screen-13 configuration with recipient context, which repeats the accepted-conversation guard.

The visual list pins the recipient portrait and room context above photographic drink rows. Every row exposes product identity, description, price, and a text accessibility hint that selection only opens configuration; selection itself creates no payment, order, or gift event.

## Paths and safety

Eligible products, no eligible products, recipient leaves, existing contact outside room, recipient blocks gifts, pending first request, venue gifting disabled, alcohol restriction, item becomes unavailable, room expires. Decline never reveals table or location; venue service and age checks remain explicit.

## QA strategy

Unit coverage verifies recipient contract and product selection. `maestro/flows/04-gift-select.yaml` accepts Jonas's real NIP-04 request, returns to his signed room profile, and only then reaches gift selection; it asserts that two operator-signed drink definitions appear while olives do not. `.qa/qa-04-gift-select.mjs` owns a real relay lifecycle and app projection verification. Extend with empty/blocked/left recipient, direct-link rejection, non-drink exclusion, stale availability, signed recipient policy, rate limits, and expiry.

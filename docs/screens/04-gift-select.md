# 04 — Select a gifted drink

## Product contract

This screen chooses an eligible drink for one known room identity. It is a social venue order, never an anonymous transfer. It states: the bar gets the order, the named recipient gets the ticket, and they may decline before fulfillment.

Resolve recipient by pubkey from current room data and require a locally retained, accepted NIP-04 conversation. The route repeats this authorization check, so a deep link cannot bypass the consent gate. Filter operator-signed products to `availability=available` and `product_kind=drink`; food and unrelated catalog records are excluded. Selection opens the normal screen-13 configuration with recipient context, which repeats the accepted-conversation guard.

## Paths and safety

Eligible products, no eligible products, recipient leaves, existing contact outside room, recipient blocks gifts, pending first request, venue gifting disabled, alcohol restriction, item becomes unavailable, room expires. Decline never reveals table or location; venue service and age checks remain explicit.

## QA strategy

Unit coverage verifies recipient contract and product selection. `maestro/flows/04-gift-select.yaml` accepts Jonas's real NIP-04 request, returns to his signed room profile, and only then reaches gift selection; it asserts that two operator-signed drink definitions appear while olives do not. `.qa/qa-04-gift-select.mjs` owns a real relay lifecycle and app projection verification. Extend with empty/blocked/left recipient, direct-link rejection, non-drink exclusion, stale availability, signed recipient policy, rate limits, and expiry.

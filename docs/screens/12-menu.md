# 12 — Room menu

## Product contract

Menu is a catalog owned by the one active venue, never a global marketplace. It opens from Room, groups available definitions by staff-authored section, and keeps venue name, cart count, and return context visible. No active room redirects to Discover.

## Relay and state contract

Read operator-signed kind `30009` definitions from only the active relay. Require `type=product`, `name`, numeric `price`, a stable `d`, and operator pubkey equal to the signed manifest operator. Project `section`, `position`, `availability`, `product_kind`, description, price, and currency. Unknown/malformed definitions are omitted; unavailable products remain visibly unavailable rather than purchasable.

Cart state is local operational input persisted in protected device storage. It may snapshot a selected definition, but review must revalidate current availability and price against relay data. Changing rooms starts a distinct venue cart and must request confirmation if the old cart would be replaced.

## Paths and failure states

Loading, sectioned results, empty catalog, unavailable item, malformed price, duplicate/newer definition, relay reconnect, room expiry, and cart from another room. Cart opens review; selecting an item opens screen 13 by event ID, not copied route data.

## Accessibility

Sections are headings. Product buttons include name, description, availability, and formatted price in text. Ordering follows section position and product position; color never carries availability alone.

## QA strategy

Unit coverage verifies grouping, selection, and empty state. `maestro/flows/12-menu.yaml` enters a real test room and asserts all three signed fixture products across their sections. `.qa/qa-12-menu.mjs` provisions its own Nuts relay, requires app projection of kind-30009 definitions, independently verifies definitions/signatures, and tears down relay plus volume. Extend with unavailable/stale definitions, wrong signer, invalid currency/price, duplicate `d`, cart restore, room switch, offline, and expiry.

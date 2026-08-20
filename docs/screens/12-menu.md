# 12 — Room menu

## Product contract

Menu is a catalog owned by the one active venue, never a global marketplace. People is the default pane after entry; choosing Menu groups available definitions by staff-authored section and keeps venue identity, cart count, and the room navbar visible. No active room reveals Tonight/Find.

Visual authority: the Night Playlist commerce/messages board `docs/design-explorations/night-playlist/mockups/03-commerce-and-messages-v1.png`, **panel 01**, with the treatment notes in `docs/design-explorations/night-playlist/screens/12-menu.md`. Night Playlist supersedes the older dark styling.

## Content and hierarchy

- Shared room chrome: signed room name, compact **Connected / Leaving by** truth, Leave, and the **People / Menu / Feed** underlined text navbar participate in the Room edge-to-edge scroll surface. Menu becomes selected when chosen and the bottom primary tabs remain visible.
- **Tonight's setlist** leads the pane with the cart pill at right, followed by a compact tempo rail. Availability and prices come directly from the venue; payment methods appear at review. No duplicate Menu title, Back row, room identity, live-set, or kitchen-moment claim is rendered inside the pane.
- Sections follow the actual `section` values of available definitions only (e.g. Drinks, Food, Events, Membership when the venue authors them); no fixed or empty categories are invented.
- Each product is a bright card: shared drink imagery for drink kinds (deterministic atlas index from product position; honest icon block otherwise), name, reflowing summary, exact formatted price, and a small blue add cue. Rows use gap-aware equal columns instead of percentage widths, so narrow layouts do not wrap unpredictably. Tapping a card opens screen 13 — it never places an order or implies kitchen state. Unavailable products stay visible but disabled and dimmed, never purchasable.
- Loading shows a quiet indicator with no list; empty catalog states the venue has not published an available menu.

## Relay and state contract

Read kind `30402` listings from only the active relay, authored by a community-anchor admin. Require `title`, a well-formed NIP-99 `price`, a stable `d`, and no event `a` link (tickets are not menu items). Project `section`, `position`, `availability`, `product_kind`, summary, price, and currency. Unknown/malformed definitions are omitted; unavailable products remain visibly unavailable rather than purchasable.

Cart state is local operational input persisted in protected device storage. It may snapshot a selected definition, but review must revalidate current availability and price against relay data. Changing rooms starts a distinct venue cart and must request confirmation if the old cart would be replaced.

## Paths and failure states

Loading, sectioned results, empty catalog, unavailable item, malformed price, duplicate/newer definition, relay reconnect, room expiry, and cart from another room. Cart opens review; selecting an item opens screen 13 by event ID, not copied route data.

## Accessibility

Sections are headings. Product buttons include name, description, availability, and formatted price in text; the cart action announces its item count. Ordering follows section position and product position; color never carries availability alone. Cards keep 48 dp targets and large text scrolls.

## QA strategy

Unit coverage verifies People-default selection, room-nav switching, grouping, selection, imagery, loading, and empty state. `maestro/flows/12-menu.yaml` enters a real test room, moves from People through the room navbar, and asserts all three signed fixture products across their sections; `01-people.yaml` proves People is the initial post-join pane. `scenario:12-menu` provisions its own Nuts relay, requires app projection of kind-30402 listings, independently verifies definitions/signatures, and tears down relay plus volume. Extend with unavailable/stale definitions, wrong signer, invalid currency/price, duplicate `d`, cart restore, room switch, offline, and expiry.

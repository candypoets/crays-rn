# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Crays serves guests, event attendees, and venue regulars while they are physically visiting a hospitality or event venue. They need to enter a verified room, meet visible people with consent, order, message, and present or manage durable tickets, passes, orders, memberships, and wallet state.

## Product Purpose

Crays is the social layer of real places. It replaces a global feed with one intentionally selected venue relay and makes the useful arc of a night—entry, people, conversation, commerce, and access—available without losing durable relationships or purchases after leaving.

## Positioning

The app binds volunteered, short-lived physical presence to a venue-operated Nostr relay. Discovery may use Bluetooth, map search, QR, or links, but joining and becoming visible are separate choices and exactly one room relay is active at a time.

## Operating Context

People use Crays in noisy, dim, mobile settings where attention is divided and actions may be interrupted by permission sheets, app switching, payment handoff, weak connectivity, or the need to show a credential quickly. Venue staff continue to operate through the Crays/Nuts admin system; mobile consumes the same Nostr objects and relay status flows.

## Capabilities and Constraints

- Expo Router, React Native, NativeWind, and `@candypoets/nipworker` are the application stack.
- Product data comes from Nostr relays; there is no parallel generic API backend.
- A Nostr public key is the durable identity. The initial implementation supports creation on this device; Apple/Google access is deliberately deferred.
- Stripe and other processor-backed payments are deliberately deferred while the room and identity foundation is built.
- Room discovery, presence, feed, commerce, and entitlement protocol shapes follow `PRD.md` and `/root/code/nuts-cash`; unresolved event kinds stay explicit rather than being invented by a screen.
- Every screen and workflow ships with a detailed screen specification, deterministic tests, Maestro coverage, and a named `.qa` scenario. Relay-backed behavior additionally requires real bootstrap and independent protocol verification.

## Brand Commitments

Crays uses direct, grounded language about rooms, people, drinks, tickets, and memberships. Protocol names stay backstage. The visual identity is already established by the canonical files under `assets/screens/` and the Crays logo and palette inherited from `/root/code/crays`.

## Evidence on Hand

- `PRD.md` is the product authority.
- `assets/screens/` contains canonical direction-setting mockups.
- `/root/code/crays` contains the incumbent brand identity.
- `/root/code/nuts-rn` and `/root/code/nuts-cash` contain the reference QA and relay workflows.

## Product Principles

- The room comes first, and presence is always volunteered.
- The night is temporary; relationships and purchased objects are durable.
- Familiar product language sits on top of Nostr ownership.
- The venue relay remains operational truth.
- Interrupted work resumes safely without duplicate identity, entitlement, or payment effects.

## Accessibility & Inclusion

All controls require at least 48×48 dp targets, logical screen-reader order, text alternatives for color-coded state, text scaling without clipped actions, reduced-motion behavior, and scanner-safe white QR quiet zones. Restrictions belong to the relevant item or event rather than excluding a person through generic onboarding failure.

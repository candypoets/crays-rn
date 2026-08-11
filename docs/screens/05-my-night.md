# 05 — My night

## Product + implementation contract

My night is the active room's urgency surface, never an archive. Entry is from the active Room action and Back returns to that room. It shows only the next event/access item, a non-terminal order, and a membership benefit published by the selected relay. Each row opens the exact durable object; absence produces one calm empty state, and a terminal (fulfilled/cancelled) order is never surfaced as the live order.

The event/access row is a strict priority: a usable kind-8 event-access award for this room wins and opens `/ticket` with that exact `awardId`; otherwise a saved upcoming RSVP opens its durable ticket; otherwise the next calendar event opens ordinary event detail. Copy and iconography must reflect that distinction. Only an event-access award may say **Ready at the door** and **Live code ready** or use a QR icon. An RSVP says **RSVP saved**; a calendar-only listing says **Coming up** and **View event**. The screen must never present a calendar listing as a scannable credential.

Data comes from one `RoomData` subscription: signed kinds 31922/31923, kind-8 awards matched to the local pubkey and their NIP-97 definition (30009/30402), and the newest valid kind-37237/legacy-27237 status. A saved RSVP is read from the protected durable ticket archive. The screen never creates local counters, assumes an award from catalog availability, or displays internal order references in the urgency row.

States cover loading, no actionable item, credential ready/exhausted/revoked, RSVP-only, calendar-only, ready/cancelled order, event removed, membership unavailable, relay loss, and room ended. Leaving locks this contextual surface but not the objects reached through Me. Every row and the Back affordance has a minimum 48×48 dp target, readable state text in addition to color/icon, logical screen-reader order, and wrapping that preserves the status at large text sizes.

## Complete QA strategy

`.qa/qa-05-my-night.mjs` seeds a protected fixture signer, quietly joins the reserved Nuts relay, and asserts the exact calendar event, event-access award, product award/status, and membership definition. Maestro first proves the My Night copy is credential-specific and hides internal order references, then opens the row and waits for the live ticket presentation. Independent verifiers cryptographically validate the fixture family, the exact order award/status, and the signed kind-27236 presentation for the fixture event-access award. Unit tests cover access-award priority, exact award routing, RSVP and calendar fallbacks, all three actions, hidden order references, empty state, and terminal filtering. Teardown sweeps every scenario fixture while retaining the reserved relay. Native variants must cover each single-card combination, all cards, no cards, slow relay, expired/revoked access, cancelled order, large text, screen-reader order, and reduced motion.

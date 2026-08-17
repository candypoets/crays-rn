# 20C — Ticket detail

## Product contract

Ticket detail handles two truthful objects: a saved RSVP, which is not a scanner credential, and a venue-issued event-access kind-8 award. Only the award can render the white live-code card. Its holder signs kind 27236 for the exact event coordinate, with a 90-second expiry and automatic refresh. The protected archive remains a last-verified projection, not independent entry authority. Protocol and relay terms stay in this implementation contract and diagnostics; customer copy says **Ready to show**, **RSVP saved**, or **No entry code yet**.

Visual authority is the Night Playlist durable/settings board
`docs/design-explorations/night-playlist/mockups/04-durable-and-settings-v1.png`,
panel 04. A valid award puts event, room, validity/uses, and one white
scanner-safe presentation in that order. A saved RSVP uses an event/venue card
and calendar icon instead of any QR-like placeholder.

## Interaction and accessibility

- **All tickets** is a labelled 48 dp Back action; system Back is equivalent.
- Valid award presentation remains owned by `EntitlementPresentation`, which
  preserves the white quiet zone, current signer result, refresh, and fullscreen
  behavior.
- Invalid awards replace door-ready wording with Used, Expired, Revoked, or
  Cancelled and explicitly state that no live code is shown.
- RSVP detail states **No entry code yet** and cannot mount the presentation
  owner. Missing exact identity renders Ticket unavailable with Back.
- All status is text, long event names reflow, and presentation availability is
  announced without relying on color.

## States and paths

Entry is from Tickets or an exact My Night access row. All tickets returns to the archive with a minimum 48×48 dp target and system Back remains equivalent. Cover found/missing ticket, upcoming/past/cancelled/revoked, cached while offline, RSVP revalidation, credential fresh/refreshing/expired/rejected, app background, clock skew, brightness/accessibility, and return to list. A stale or missing presentation shows state and recovery actions but never an expired code as valid. The QR retains a white quiet zone, enlarges on tap, refreshes after foregrounding, and remains reachable with large text. Room presence is neither required nor published by opening this screen.

## QA contract

Component QA covers valid/invalid/missing awards, the explicit non-scannable
RSVP path, plain customer copy, presentation ownership, and the 48 dp Back
target. `maestro/flows/20c-ticket-detail.yaml` opens the exact fixture award,
requires **Ready to show**, rejects relay jargon, and waits for the live code.
`scenario:20c-ticket-detail` independently verifies the signed 27236 payload
rather than screenshot pixels, then owns fixture teardown. RSVP
publication/archive remain separately covered by screens 20/20B. Staff
replay/clock/offline acceptance is D-010.

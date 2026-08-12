# 20 — Room event

## Product + implementation contract

The screen reads an operator-authored kind 31922/31923 from the selected room and shows start/end, location, summary, capacity, and price. A free RSVP publishes signed kind 31925 with exact `a`, `d`, and textual status; it never publishes presence. Paid ticket acquisition stays disabled until payment rails exist. Successful free RSVP exposes a white presentation surface, but valid entry still requires the future short-lived kind-27236 contract.

Visual authority is the Night Playlist discovery/access board
`docs/design-explorations/night-playlist/mockups/05-discovery-and-access-v1.png`,
panel 06. One venue hero carries the event title, signed room, location, and
explicit Event badge. Date/time and access continue as a short timeline below;
the page does not become a generic card grid.

## Interaction and states

- Back is a labelled 48 dp action and never changes RSVP state.
- A free event exposes one **RSVP going** action. While publishing it reads
  **Sending RSVP…**, is busy/disabled, and prevents a duplicate event.
- The action changes to **Going · RSVP sent** only after the route owner has a
  confirmed publish and saved RSVP.
- A paid event says **Ticket payment not configured** and cannot call RSVP or
  synthesize a checkout.
- The saved-RSVP surface explicitly says it is a preview and not a scannable
  door credential; no QR is fabricated.
- Missing route identity, removed/replaced events, relay rejection, offline,
  signer failure, and retry retain Back and exact error truth.

All event facts are text and reflow under large type. Image, color, badge, and
icons are supplementary. Errors use the shared announced banner, and the
scrollable shell keeps the action reachable.

States include free/paid, going/interested/declined, full/waitlist, member-gated, expired/cancelled, event replaced, relay rejection, offline, signer missing, RSVP retry, and ticket owned. Repeated actions must replace rather than multiply user RSVP state. A route `id` that matches no projected event renders an explicit “Event unavailable” state with a back action; the route never substitutes the first projected event, so an RSVP can only ever be signed for the addressed event.

## Complete QA strategy

`.qa/qa-20-room-event.mjs` reads a real signed calendar event, publishes RSVP
through the native nipworker signer, then independently queries exact
author/address/status and verifies the signature. Unit tests cover free
publish, pending lock, paid disabling, saved non-scannable state, errors, Back,
and unavailable identity. Additional fixtures cover capacity, all RSVP states,
malicious operator mismatch, replacement, duplicate taps, app background,
no-presence assertion, paid deferral, screen reader/time-zone/date formatting,
and stale credentials.

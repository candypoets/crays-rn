# 20 — Room event

## Product + implementation contract

The screen reads an operator-authored kind 31922/31923 from the selected room and shows start/end, location, summary, capacity, and price. A free RSVP publishes signed kind 31925 with exact `a`, `d`, and textual status; it never publishes presence. Paid ticket acquisition stays disabled until payment rails exist. Successful free RSVP exposes a white presentation surface, but valid entry still requires the future short-lived kind-27236 contract.

States include free/paid, going/interested/declined, full/waitlist, member-gated, expired/cancelled, event replaced, relay rejection, offline, signer missing, RSVP retry, and ticket owned. Repeated actions must replace rather than multiply user RSVP state.

## Complete QA strategy

`.qa/qa-20-room-event.mjs` reads a real signed calendar event, publishes RSVP through the native nipworker signer, then independently queries exact author/address/status and verifies the signature. Unit tests cover free action and paid disabling. Additional fixtures cover capacity, all RSVP states, malicious operator mismatch, replacement, duplicate taps, app background, no-presence assertion, paid deferral, screen reader/time-zone/date formatting, and stale QR.

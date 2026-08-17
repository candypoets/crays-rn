# 20B — Tickets

## Product contract

Tickets is the durable event-access archive under Me. It lists only objects owned by the local Nostr identity: a relay-confirmed RSVP stored after an `OK`, or an issuer-signed kind-8 `event_access` award. Merely seeing an event definition never creates a ticket. Issued access is grouped as **Ready at the door**; RSVPs remain a distinct group because an RSVP alone is not a scanner credential. Upcoming RSVPs sort by event time; ended items remain under Past. Both archives survive leaving and app relaunch, while relay events remain authority for changes or revocation.

Visual authority is the Night Playlist durable/settings board
`docs/design-explorations/night-playlist/mockups/04-durable-and-settings-v1.png`,
panel 04. Rows use venue imagery, event title, room/date, and a textual access
state. The list never renders a QR or makes a calendar RSVP resemble a door
credential.

## Interaction and accessibility

- **Back to Me** and every ticket row meet the 48 dp floor.
- Issued awards say **Show at the door** only while presentable; revoked,
  exhausted, expired, and cancelled awards retain a details route with their
  reason and no valid-action wording.
- Upcoming **RSVPs** carry the separate **Saved plans · not door codes** note;
  past RSVP rows move under Past.
- Empty copy states that only a confirmed RSVP or venue-issued ticket appears.
- Names and state copy reflow, imagery has a venue label, and status is never
  color-only.

## States and paths

Cover protected storage loading, empty, one/many upcoming, past, same-time deterministic ordering, malformed cache, relay-confirmed RSVP, issuer award, cancellation/revocation, relay offline, room left, relaunch, and opening exact detail. An RSVP write that times out or is rejected must not appear. The row says venue, date, and textual access state without implying its decorative icon scans.

## QA contract

Unit tests reject malformed protected RSVP records, prove address-based
idempotency, and cover upcoming/past/empty, exact row routing, presentable and
revoked awards. `maestro/flows/20b-tickets.yaml` signs into the native fixture
identity, joins an isolated Nuts relay, publishes a real kind-31925 RSVP
through the public UI, and opens Tickets. `.qa/qa-20b-tickets.mjs`
independently verifies the exact calendar address, accepted status, signer
signature, room-definition consumption, and teardown. `qa-20c-ticket-detail.mjs`
separately covers issuer-awarded scanner access and kind-27236 proof. Native
variants cover leave, cold relaunch, empty storage, two venues, RSVP rejection,
and revoked/ended records. `.qa/qa-20d-rsvp-rejected.mjs` owns the rejection
path: the badge-gated relay refuses the RSVP write, the event screen shows its
error state, Tickets shows no upcoming entry, and the independent verifier
proves no kind-31925 reached the relay.

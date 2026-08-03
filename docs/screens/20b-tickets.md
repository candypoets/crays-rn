# 20B — Tickets

## Product contract

Tickets is the durable event-access archive under Me. It lists only objects owned by the local Nostr identity: a relay-confirmed RSVP stored after an `OK`, or an issuer-signed kind-8 `event_access` award. Merely seeing an event definition never creates a ticket. Issued access is grouped as **Ready at the door**; RSVPs remain a distinct group because an RSVP alone is not a scanner credential. Upcoming RSVPs sort by event time; ended items remain under Past. Both archives survive leaving and app relaunch, while relay events remain authority for changes or revocation.

## States and paths

Cover protected storage loading, empty, one/many upcoming, past, same-time deterministic ordering, malformed cache, relay-confirmed RSVP, issuer award, cancellation/revocation, relay offline, room left, relaunch, and opening exact detail. An RSVP write that times out or is rejected must not appear. The row says venue, date, and textual access state without implying its decorative icon scans.

## QA contract

Unit tests reject malformed protected RSVP records and prove address-based idempotency. `maestro/flows/20b-tickets.yaml` signs into the native fixture identity, joins an isolated Nuts relay, publishes a real kind-31925 RSVP through the public UI, and opens Tickets. `.qa/qa-20b-tickets.mjs` independently verifies the exact calendar address, accepted status, signer signature, manifest consumption, and teardown. `qa-20c-ticket-detail.mjs` separately covers issuer-awarded scanner access and kind-27236 proof. Native variants cover leave, cold relaunch, empty storage, two venues, RSVP rejection, and revoked/ended records. `.qa/qa-20d-rsvp-rejected.mjs` owns the rejection path: the badge-gated relay refuses the RSVP write, the event screen shows its error state, Tickets shows no upcoming entry, and the independent verifier proves no kind-31925 reached the relay.

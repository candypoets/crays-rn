# 20C — Ticket detail

## Product contract

Ticket detail handles two truthful objects: a relay-confirmed RSVP, which is not a scanner credential, and a venue-issued event-access kind-8 award. Only the award can render the white QR card. Its holder signs kind 27236 for the exact event coordinate, with a 90-second expiry and automatic refresh. The protected archive remains a last-verified projection, not independent entry authority.

## States and paths

Cover found/missing ticket, upcoming/past/cancelled/revoked, cached while offline, RSVP revalidation, credential fresh/refreshing/expired/rejected, app background, clock skew, brightness/accessibility, and return to list. A stale or missing presentation shows state and recovery actions but never an expired code as valid. Room presence is neither required nor published by opening this screen.

## QA contract

Component QA retains the explicit non-scannable RSVP path. `maestro/flows/20c-ticket-detail.yaml` opens the exact fixture award and waits for the live code. `.qa/qa-20c-ticket-detail.mjs` independently verifies the signed 27236 payload rather than screenshot pixels. RSVP publication/archive remain separately covered by screens 20/20B. Staff replay/clock/offline acceptance is D-010.

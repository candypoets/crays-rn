# Memberships & passes

## Product and implementation contract

This is the durable access archive under Me. It lists only valid kind-8 awards
for the local pubkey whose kind-30009 `t=membership` definition (or kind-30402
pass listing) is available from the venue and whose issuer is an anchor admin
or the anchor's badge_issuer. Memberships and passes group into **Ready to
use** and **History & action needed**. Every row states venue and
Active/Available/Exhausted/Expired/Revoked/Cancelled in text; finite passes
state the relay-derived remaining count.

The archive is a minimal stable copy of previously verified events and remains
after room leave. Reconnecting revalidates and replaces it. It never issues an
award, restores a use, or acts as a competing counter. Selection passes only the
award ID into detail.

Visual authority is the Night Playlist durable/settings board
`docs/design-explorations/night-playlist/mockups/04-durable-and-settings-v1.png`,
panel 05. Venue-backed rows group into **Ready to use** and **History & action
needed**, with name, room, textual state, and relay-derived remaining uses.
There are no points, streaks, or locally animated counters.

Back and every row meet 48 dp. Long names reflow; venue imagery is labelled;
status is never color-only. Empty state uses customer language (“Venue-issued”)
without exposing relay implementation terms.

## States and paths

Cover loading, empty, one/many venues, active membership, available finite or
unlimited pass, final use, exhausted, expired, issuer-revoked, cancelled,
missing definition, wrong holder/issuer, malformed status, offline cache,
relaunch, room leave, and exact detail navigation. Latest status per context
wins; same-second lower event ID is the deterministic tie-break.

## Complete QA strategy

Pure tests cover context deduplication, cancellation rollback, remaining-use
math, unlimited passes, expiry, revocation precedence, and fresh reusable
presentation contexts. `.qa/qa-memberships.mjs` owns the isolated lifecycle;
`maestro/flows/memberships.yaml` joins its disposable real
Nuts relay, sees an issuer-signed membership and three-use pass, asserts **2 uses
left**, opens that exact pass, and sees the fulfilled activity. The independent
presentation verifier validates the signed kind-27236 payload. Complete the
scanner trust/replay/iOS matrix under D-010/D-011 before production entry use.

Component tests additionally cover active/history grouping, exact award
routing, empty state, finite remaining-use text, and trusted activity display.

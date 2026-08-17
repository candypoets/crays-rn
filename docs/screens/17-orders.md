# 17 — Orders

## Product + implementation contract

Orders lists non-terminal product orders first and fulfilled/cancelled history second. Each row uses the award/status join defined for screen 15 and opens by its stable internal order reference, but the list presents product, amount, and plain-language status rather than exposing that internal identifier. A multi-use kind-30402 pass is an entitlement and must never be projected into Orders merely because its use status has an `order` context. Local cart content is not an order; only a trusted award for a single-use product becomes durable history. Search/filter stays absent until volume warrants it.

Entry is Me → Orders; Back returns to Me and has a minimum 48×48 dp target. Selecting a row opens the exact order detail. States: empty; active only; past only; mixed; status replacement; missing definition; offline cached record; cancelled; refund pending/refunded; and duplicate events. Sort is newest status then deterministic ID. Rows wrap product names under large text, announce product and status without reading internal references, and never rely on pill color alone.

## Complete QA strategy

`scenario:17-orders` asserts the real Nuts product award/status projection and opens the active group. Maestro requires the ready drink order while explicitly rejecting the QA order/check-in references and the multi-use pass from the list. Independent verification checks the exact signed product award, recipient, order context, ready status, and app projection; teardown sweeps the reserved relay fixtures. Unit tests cover listing classification, grouping, hidden references, 48 dp Back affordance, and callback identity. Relay fixtures must test all statuses, duplicate award IDs, wrong-recipient and wrong-address statuses, legacy reads, dates/venues, relaunch, accessibility order, and empty/error copy.

## Night Playlist implementation

The archive follows board 04 panel 03 with compact child-route chrome. Active venue-issued orders are full tickets with product art, venue/time, exact amount, a text badge, a five-node progress rail, and a **View order** affordance. Fulfilled and cancelled records collapse into a quieter ledger grouped by local calendar date. Input is sorted by newest trusted status timestamp and then stable internal ID, while that ID remains absent from visible and accessible labels. Protected archive hydration, live refresh, cached/offline records, archive read failure, “no saved active orders,” and a confirmed empty trusted history remain visually and textually distinct.

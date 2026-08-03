# 17 — Orders

## Product + implementation contract

Orders lists non-terminal relay records first and fulfilled/cancelled history second. Each row uses the award/status join defined for screen 15 and opens by stable order reference. Local cart content is not an order; only a signed award becomes durable history. Search/filter stays absent until volume warrants it.

States: empty; active only; past only; mixed; status replacement; missing definition; offline cached record; cancelled; refund pending/refunded; and duplicate events. Sort is newest status then deterministic ID.

## Complete QA strategy

`.qa/qa-17-orders.mjs` asserts the real Nuts award/status projection and opens the active group. Unit tests cover grouping and callback identity. Relay fixtures must test all statuses, duplicate award IDs, wrong-recipient and wrong-address statuses, legacy reads, dates/venues, relaunch, accessibility order, and empty/error copy.

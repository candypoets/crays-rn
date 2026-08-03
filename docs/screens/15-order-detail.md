# 15 — Live order detail

## Product + implementation contract

One detail component serves self-orders and gifts. It derives product, recipient, reference, amount, and status from a kind-8 award plus its trusted kind-30009 definition and latest matching kind-37237 status (`e`, `a`, `p`, and exactly one `order`/`event` context). UI maps `pending → Sent`, `accepted → Accepted`, `processing → Preparing`, `ready → Ready`, `fulfilled → Served`, and `cancelled → Cancelled`; “Delivered” is forbidden for venue fulfillment. Receipt and refund fields remain pending until a real payment reference exists.

States include implicit pending, every status transition, same-second deterministic tie handling, legacy status read, missing definition, revoked/expired award, relay offline, confirming venue, refund pending/refunded, support unavailable, and no order. Duplicate pay is never shown during uncertainty.

## Complete QA strategy

`.qa/qa-15-order-detail.mjs` opens a real issuer-signed product award with a venue-signed ready status and independently matches exact IDs. Maestro checks status language, progress, deferred receipt, and absence of “Delivered.” Unit tests cover the mapping and unavailable state. Contract fixtures must additionally exercise every ladder state, invalid signer/tag joins, stale replacement events, cancellation/refund copy, gifts, relaunch, support, large text, and offline recovery.

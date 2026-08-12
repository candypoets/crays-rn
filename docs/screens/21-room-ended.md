# 21 — Leave room / room ended

## Product + implementation contract

Leave is a two-screen privacy workflow. Confirmation names that presence and feed access end while messages, orders, receipts, tickets, passes, memberships, blocks, and wallet state remain. For visible users the app first resolves the relay's NIP-11 root and publishes a signed NIP-53 kind-10312 replacement with the same community-anchor `a`, `status=left`, and bounded expiry; only relay confirmation clears the active room. Quiet users publish nothing. The completion screen states no social announcement was sent and cannot reopen the locked feed.

States: quiet leave; visible confirmed; write rejected; offline retry; slow relay; repeated tap; automatic expiry; signal weak/reconnect/locked; cancel; and completed. Failure keeps the active room selected so the user can retry and does not falsely claim privacy completion.

## Complete QA strategy

`.qa/qa-21-room-ended.mjs` visibly joins with a dedicated fourth fixture signer (so regular replacement cannot overwrite a seeded roster identity), confirms leave, and independently queries/verifies the exact anchor-bound kind-10312 `left` replacement event before teardown. Maestro asserts both consequence and retained objects. Separate QA must prove quiet leave creates zero user presence events, rejected write retains session, relaunch after completion routes Discover, stale subscriptions close, feed/post writes fail, and screen reader/back behavior is safe.

# 05 — My night

## Product + implementation contract

My night is the active room's urgency surface, never an archive. It shows only the next event credential, a non-terminal order, and a membership benefit published by the selected relay. Each card opens the exact durable object; absence produces one calm empty state. Data comes from one `RoomData` subscription: signed kinds 31922/31923, kind-8 awards matched to the local pubkey and kind-30009 definition, and the newest valid kind-37237/legacy-27237 status. It never creates local counters or assumes an award from catalog availability.

States cover loading, no actionable item, ready/cancelled order, event removed, membership unavailable, relay loss, and room ended. Leaving locks this contextual surface but not the objects reached through Me.

## Complete QA strategy

`.qa/qa-05-my-night.mjs` seeds a protected fixture signer, quietly joins an isolated Nuts relay, and asserts the exact calendar event, product award/status, and membership definition. Independent verifiers cryptographically validate fixtures and require Android logs for the exact award/status IDs. Unit tests cover all three actions plus empty and terminal filtering. Native variants must cover each single-card combination, all cards, no cards, slow relay, expired event, cancelled order, large text, screen reader order, and reduced motion.

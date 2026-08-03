# 28 — Switch rooms

## Product + implementation contract

Exactly one room relay may be active. Selecting another signed room while one is active shows current and destination names, verifies the destination manifest first, explains what ends/remains, and requires “Leave and enter new room.” Visible presence must receive a confirmed `left` replacement before active-room state clears. The app then opens the destination Join privacy screen; it does not silently join or copy visibility. Cancel and destination failure retain the current room and subscriptions.

States include destination loading/invalid/closed/offline, current leave rejected, switch in progress, cancel, quiet current room, visible current room, and successful handoff. Messages/durable data remain available; two room feed subscriptions may never overlap.

## Complete QA strategy

`.qa/qa-28-switch-room.mjs` provisions two independent Nuts relays/volumes, joins A visibly, opens B's signed manifest, confirms switch, verifies A's exact left event and B's Join privacy screen, and queries both relays independently. It asserts no B presence before explicit join and exact teardown for both. Unit tests cover labels, disabled destination, confirm/cancel. Native variants cover B outage, A write rejection, relaunch mid-switch, quiet A, back, and subscription-count logs proving no overlap.

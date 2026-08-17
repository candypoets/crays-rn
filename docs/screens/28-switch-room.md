# 28 — Switch rooms

## Product + implementation contract

Exactly one room relay may be active. Selecting another signed room while one is active shows current and destination names, verifies the destination kind-30312 definition first, explains what ends/remains, and requires “Leave and enter new room.” Visible presence must receive a confirmed room-bound kind-10312 `left` replacement before active-room state clears. The app then opens the destination Join privacy screen; it does not silently join or copy visibility. Cancel and destination failure retain the current room and subscriptions.

Visual authority is the Night Playlist discovery/access board
`docs/design-explorations/night-playlist/mockups/05-discovery-and-access-v1.png`,
panel 05. The screen is a two-chapter comparison, **You are in** and **You’re
entering**, using distinct venue crops and verified text rather than generic
side-by-side cards.

## UI and interaction

- The signed current room is always the first chapter.
- Destination loading says **Verifying destination…** and disables the
  consequential action. Invalid/offline destinations remain explicit and do
  not replace the current chapter.
- The centered consequence names the current room and explains that presence
  and live-feed access end while durable objects remain.
- **Leave and enter new room** is Commitment Coral. It reads **Switching
  rooms…** and rejects repeats while the old-room leave is settling.
- **Stay in [current room]** cancels with no relay/subscription mutation.

States include destination loading/invalid/closed/offline, current leave
rejected, switch in progress, cancel, quiet current room, visible current room,
and successful handoff. Errors stay near the action and are announced by the
shared live banner. All actions meet 48 dp and text may reflow. Messages and
durable data remain available; two room feed subscriptions may never overlap.

## Complete QA strategy

`scenario:28-switch-room` provisions two distinct signed room identities on
the real coordinator-reserved relay. The deployed Nuts coordinator currently
limits this QA owner to that one reserved relay, so the second bootstrap
preserves A's fixtures while adding B's definition and room-scoped fixtures; it
never fakes a second relay or uses an in-memory store. The runner joins A
visibly, independently round-trips both signed definitions, opens B's definition,
confirms the switch, verifies A's exact left event before checking that B has
no presence, and tears down the shared fixture family exactly once through
both state views. If the coordinator later allows a second owner relay, the
runner must retain the distinct-room checks and may promote A/B to separate
relay URLs and teardown ownership.

Unit tests cover both chapters, destination loading/unavailable, errors,
confirm/cancel, and switching lock. Native variants cover B outage, A write
rejection, relaunch mid-switch, quiet A, back, and subscription-count logs
proving no overlap.

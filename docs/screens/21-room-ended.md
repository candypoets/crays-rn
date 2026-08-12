# 21 — Room ended

## Product + implementation contract

Room Ended is the settled half of the leave privacy workflow. Its visual
authority is the Night Playlist exit treatment in
`docs/design-explorations/night-playlist/mockups/04-durable-and-settings-v1.png`,
panel 07, with the retained-item structure from
`docs/design-explorations/night-playlist/mockups/05-discovery-and-access-v1.png`,
panel 08. The older dark screen PNG is no longer authoritative.

The completion state renders only after explicit leave or automatic expiry
has settled. It states that presence ended, the live feed is locked, and no
social announcement was sent. Messages, orders, receipts, tickets, passes,
memberships, blocks, and wallet state remain.

## UI and navigation

- A venue-exit hero names the previous room and distinguishes an explicit
  leave from an automatic leave-time expiry.
- A lock and retained list show Messages, Orders, Tickets & passes,
  Memberships, and Wallet with a textual **Kept** status.
- **Discover another room** replaces the completed room path with Discover.
  **Open Messages** switches to Messages without restoring the old room.
- There is no action that can reopen the locked feed.

States include explicit completion, automatic expiry, retained-item list, and
long room names. Relay rejection/offline/retry remain on the preceding Leave
screen and must never reach this completion state.

## Accessibility

The settled headline is a header, all retained states are textual, actions meet
48 dp, and large content remains scrollable. The photo is labelled with the
previous room but is not the only carrier of meaning. Motion is a single short
route crossfade and respects reduced motion.

## Complete QA strategy

`LeaveAndSwitchScreens.test.tsx` covers explicit/automatic completion,
retained-object labels, and both navigation callbacks.
`.qa/qa-21-room-ended.mjs` visibly joins with a real fixture signer, confirms
leave, and independently queries/verifies the exact `left` replacement event
before teardown. Maestro asserts the privacy statement and retained objects.
Separate QA must prove quiet leave creates zero user presence events, rejected
write retains session, relaunch after completion routes Discover, stale
subscriptions close, feed/post writes fail, and screen reader/back behavior is
safe.

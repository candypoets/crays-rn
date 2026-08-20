# 21 — Room ended

## Product + implementation contract

Room Ended is the settled half of the leave privacy workflow. Its visual
authority is the Night Playlist exit treatment in
`docs/design-explorations/night-playlist/mockups/04-durable-and-settings-v1.png`,
panel 07, with the retained-item structure from
`docs/design-explorations/night-playlist/mockups/05-discovery-and-access-v1.png`,
panel 08. The older dark screen PNG is no longer authoritative.

Leave is a two-screen privacy workflow. For visible users the app publishes a
signed NIP-53 kind-10312 replacement with the same kind-30312 room `a` address,
`status=left`, and bounded expiry; only relay confirmation clears the active
room. Quiet users publish nothing.

The completion state renders only after explicit leave or automatic expiry
has settled. It is the **After** state of the Tonight tab—not a root-stack
screen—so the Tonight, Messages, and Me footer remains present. It states that
presence ended, the live feed is locked, and no social announcement was sent.
Messages, orders, receipts, tickets, passes, memberships, blocks, and wallet
state remain.

## UI and navigation

- A venue-exit hero names the previous room and distinguishes an explicit
  leave from an automatic leave-time expiry.
- A lock and retained list show Messages, Orders, Tickets & passes,
  Memberships, and Wallet with a textual **Kept** status.
- **Discover another room** acknowledges the settled marker in
  `RoomSessionProvider` and changes the same Tonight destination to Find. It
  performs no route redirect and cannot loop back to Room ended.
  **Open Messages** switches through the persistent tab navigator without
  restoring the old room or clearing the settled marker; returning to Tonight
  still shows completion until the person chooses Discover.
- The legacy `/room-ended` path redirects into `/room`; it never covers the
  tab navigator.
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
retained-object labels, and both navigation callbacks. `room-route.test.tsx`
proves the state is rendered under Tonight, Discover acknowledges it exactly
once, Messages preserves it, and acknowledged state renders Find.
`scenario:21-room-ended` visibly joins with a real fixture signer, confirms
leave, and independently queries/verifies the exact `left` replacement event
before teardown. Maestro asserts the privacy statement and retained objects.
Separate QA must prove quiet leave creates zero user presence events, rejected
write retains session, relaunch after completion routes Discover, stale
subscriptions close, feed/post writes fail, and screen reader/back behavior is
safe.
The dedicated fourth fixture signer prevents regular replacement from
overwriting a seeded roster identity. The independent verifier requires the
exact room-bound kind-10312 `left` event before teardown. The device flow also
proves the primary footer remains visible and **Discover another room** reaches
Find rather than looping.

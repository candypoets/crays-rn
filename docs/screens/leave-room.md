# Leave room

## Product contract

Leave is the confirmation half of the room privacy boundary. It opens only
from an active room, names that room, and requires an explicit consequential
action before any presence, subscription, or local session changes. The Night
Playlist visual family is the dark venue exit in
`docs/design-explorations/night-playlist/mockups/04-durable-and-settings-v1.png`,
panel 07; the confirmation remains a calm pale-lilac decision surface until
the protocol has settled.

## Entry, hierarchy, and interaction

- Entry is the labelled Leave control in the active Room header. Back or
  **Stay in the room** returns to the exact active-room view without changing
  state.
- The first viewport names the current signed room over a venue-exit image and
  states that leaving is private.
- Three consequences remain textual: the person stops appearing in People,
  this live feed locks, and durable messages/orders/tickets/passes/memberships
  remain.
- **Leave room and hide me** is Commitment Coral because it changes privacy
  and room access. While the relay/session operation is active it reads
  **Leaving…**, announces busy/disabled state, and rejects repeat taps.

## Nostr and relay behavior

For visible presence, `src/app/leave-room.tsx` signs and publishes the same
kind-78 presence identity with `status=left`, the active room `h`, and short
expiration to the one active room relay. At least one required relay must
return true before `RoomSessionProvider` clears the room and navigation may
replace this screen with Room Ended. A quiet visitor has no published presence
to replace and clears the local session without fabricating a relay event.

An error or timeout remains on this screen, keeps the active room selected,
restores the action, and never claims that privacy completion occurred.

## States and failures

- visible and quiet current rooms;
- idle, leaving, confirmed, relay rejection, timeout, and retry;
- cancel/back with no side effect;
- repeated tap while leaving;
- active room lost before entry redirects to Discover through the route owner.

## Accessibility

The room name and all consequences are text, not icon-only. Controls meet the
48 dp floor; the consequential action has a busy state and stable dimensions.
The venue image has a room-specific label, errors use the shared live error
banner, and large text may reflow in the scrollable shell.

## QA strategy

`LeaveAndSwitchScreens.test.tsx` covers exact consequences, confirm/cancel,
error retention, and repeat-tap locking. `maestro/flows/leave-room.yaml`
visibly joins a real isolated room, captures the confirmation state, confirms
leave, and waits for Room Ended. `.qa/qa-leave-room.mjs` owns bootstrap,
Maestro, independent signed `left`-event verification with polling, and exact
relay/volume teardown.

# Night Playlist motion system

Motion should feel like a live set changing sections: purposeful, rhythmic,
and quiet when the user is deciding. It must never turn protocol state into a
game or make a person wait for decoration.

## Timing tokens

These are the default values for Reanimated transitions. A screen may shorten a
transition for a dense task, but it should not invent a new timing scale.

| Token | Duration | Use |
| --- | ---: | --- |
| `tempo-press` | 120 ms | Press scale, icon tint, selected chip, focus ring |
| `tempo-fade` | 180 ms | Error copy, empty state, tab content crossfade |
| `tempo-route` | 280 ms | Shared-axis route transition and tab content handoff |
| `tempo-sheet` | 360 ms | Person/profile sheet, payment sheet, confirmation sheet |
| `tempo-moment` | 520 ms | Timeline marker, hero image, first-room arrival sequence |
| `tempo-status` | 420 ms | Order/ticket status rail after confirmed data arrives |

Use platform easing and Reanimated worklets. Springs are reserved for a sheet
settling or a draggable rail, not for every button. A spring should settle once;
no control should keep breathing after it is actionable.

## Shared choreography

### Room arrival

1. Keep the verified venue header and safe-area layout in place.
2. Fade the room background in at `tempo-fade`.
3. Draw the current moment marker along the tempo rail over
   `tempo-moment`.
4. Stagger People and the first feed item by 60 ms, with a maximum of three
   staggered items. More items enter as one batch.
5. Stop all entrance motion when the first meaningful content is visible.

The relay connection may show a quiet connecting label, but it must never hold
the screen in an animated loop. If the room expires during the sequence, cut to
the room-ended state and explain why.

### Moment selection

Selecting a room moment uses a shared-element handoff: the selected rail node
scales to 1.04, its color becomes the selected role, and the detail content
crossfades in at `tempo-route`. The same moment identity must remain visible in
the destination header so the user knows where they came from.

### Person card

Tap opens a native sheet. The avatar and name travel with the sheet for
`tempo-sheet`; the background dims with a single fade. The sheet must be
dismissible by swipe, visible Back, and system Back. Message is the first
action; Send a drink is secondary. Browse quietly is a state choice, not an
animated reveal.

### Gift and order

The selected person remains pinned while the drink changes. Selection updates
the price and item image with `tempo-press`; it never jumps the user to a new
screen without an explicit action. Review uses a route transition. After
payment/order success, the status rail animates from its current confirmed
state to the next state with `tempo-status`. Never animate to Accepted or
Preparing before the relay/order contract confirms it.

### Room exit

Leaving uses a normal confirmation route. On confirmed leave, the live room
content fades out once, the privacy closure state enters, and durable items
remain visible as stable rows. There is no celebratory “you left” animation and
no social announcement.

## Accessibility and reduced motion

- Respect the system Reduce Motion setting. Replace travel, stagger, pulse, and
  parallax with a 160–180 ms crossfade or an instant state change.
- Never communicate connection, visibility, ticket validity, or order status by
  motion or color alone; the text state is always present.
- Do not continuously drift avatars. Presence is represented by membership in
  the visible list and a textual count.
- Keep focus/order stable when a sheet opens, the keyboard appears, or a tab
  changes. Return focus to the invoking control on dismissal.
- All animated controls remain at least 48 dp, and large text must not cause a
  status rail or primary action to clip.

## Implementation guardrails

- Use `react-native-reanimated` worklets for visual interpolation; do not run
  animation loops with JS timers or read FlatBuffer views inside worklets.
- Keep Nostr subscriptions and derived data in their existing owners. Motion
  reads a small stable UI projection and never owns protocol state.
- Use native Expo Router stack/tab transitions for navigation. Do not replace
  predictive Back or the platform tab bar with a custom gesture system.
- Pause or dispose expensive image/video work when a route blurs or the app is
  backgrounded. Do not make a feed unreadable while images load.
- Maestro and component tests should assert settled states and accessibility
  labels, not fragile frame timing. A motion test may use a reduced-motion
  switch or a deterministic settled test id.

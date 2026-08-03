# Primary tab navigation

## Product and interaction contract

The authenticated app has four top-level destinations in this fixed order:
Room, Discover, Messages, and Me. They are owned by an Expo Router `Tabs`
navigator rather than by screen content. The tab navigator is the only primary
navigation bar in the app; `AppShell` owns screen chrome and content layout but
does not render or initiate primary navigation.

The initial destination is Room when an active room exists. If Room has no
active room, its existing route guard selects Discover. Entry redirects and
deep links keep their existing public paths (`/room`, `/discover`, `/messages`,
and `/me`) because the `(tabs)` route group does not contribute a URL segment.

Selecting an inactive tab changes the selected tab in place. It must not push
or replace a screen on the root stack and must not show a stack transition.
Each visited tab retains its route parameters, scroll position, and local UI
state while the tab navigator remains mounted. Selecting the current tab is
idempotent. On Android, system Back from a noninitial tab returns to the initial
Room tab; it does not replay every tab press as stack history.

Hierarchical tasks such as Menu, a person, a conversation, Settings, Tickets,
or Wallet remain root-stack destinations. They cover the tab navigator while
open, do not render a second tab bar, and return to the originating tab using
system Back or their visible Back action. This keeps the four destinations as
sections rather than turning workflow steps into tabs.

## Visual and responsive behavior

The navigator uses the platform bottom-tab component on compact devices with
the Crays Night surface, Wine Edge divider, Crays Signal selected state, and a
muted unselected state. Active icons use their filled Ionicons counterpart;
inactive icons use the outline counterpart. Labels remain visible. The
navigator owns bottom safe-area handling, including gesture navigation and the
iPhone home indicator, and hides while the keyboard is open so it cannot cover
an input action.

The content shell stays within its existing readable width. Large screens must
not stretch content merely because navigation ownership changed. A later
tablet-specific rail can replace the compact bar without changing destination
identity or route paths.

## Deterministic states and failures

- **Cold authenticated entry:** entry routing selects Room or Discover from
  protected account and active-room state before the tab surface appears.
- **First visit:** a tab may mount lazily and shows the destination's existing
  loading, empty, or cached state.
- **Return visit:** the destination remains mounted; state is not reset just
  because another tab was selected. Me refreshes protected durable counts when
  it regains focus, while Discover stops any active Nearby scan when blurred.
- **Room unavailable or ended:** Room redirects to Discover or Room ended using
  the existing session rules. The navigator does not fabricate room state.
- **Relay offline:** tab selection still succeeds immediately. The selected
  screen owns its offline or retry state and navigation never waits on a relay.
- **Protected storage failure:** the entry router owns recovery before primary
  navigation. A tab press never creates or repairs identity state.
- **Repeated or rapid presses:** selection is idempotent and cannot create
  duplicate stack entries, relay publishes, or subscriptions.

## Accessibility

Each destination exposes a stable text label and a native tab role/state
through the navigator. Icon color and fill are supplemental; selection is not
communicated by color alone. The platform navigator supplies appropriately
sized touch targets and safe-area spacing. Screen-reader order is Room,
Discover, Messages, Me, matching visual order. The bar hides on keyboard open
but returns when the keyboard closes, and system Back/predictive Back remains
available for hierarchical screens.

## Nostr and relay behavior

The navigator performs no Nostr query, publish, identity operation, or relay
selection. It does not create a manager. The existing app-wide manager remains
owned by `src/nostr/manager.ts`; room data remains owned by `RoomDataProvider`.
Visited tabs may remain mounted as normal tab destinations, so their existing
owners must keep stable subscription IDs, narrow worker messages before reads,
and unsubscribe when the tab navigator ultimately unmounts. A tab selection is
never protocol proof and never changes presence.

## QA ownership

`maestro/flows/primary-tabs.yaml` enters a real isolated relay room, changes a
Room-local view, visits all four destinations, returns to Room to prove the
view survived, and opens Menu to prove hierarchical screens do not render a
second tab bar. `.qa/qa-primary-tabs.mjs` owns relay bootstrap, the Maestro
exercise, independent relay/manifest and room-projection verification, and
teardown. Unit tests own destination order, stable automation IDs, selected
icon state, unknown-route failure, and the absence of manual tabs in
`AppShell`.

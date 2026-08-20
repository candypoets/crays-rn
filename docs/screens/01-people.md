# 01 — People in the room

## Product contract

Canonical visual reference: `artifacts/crays-redesign/crays-one-night-one-home-canvas-final.png`, panel **5. Tonight / Inside**. This approved One Night, One Home canvas supersedes the incumbent dark room PNGs and earlier Night Playlist room boards for composition and color while the relay contract below remains authoritative.

People is the social destination inside an active room and is selected by default after entry; the shared room navbar exposes **People / Menu / Feed** while the visible count lives in the roster heading. People proves that exactly one venue relay is active, shows only opted-in visible presence, and never exposes distance, popularity, or hidden attendance. Quiet visitors retain full read, ordering, ticket, and membership access without appearing in this roster.

Entry requires a persisted `ActiveRoom`. With no active room, route to Discover. The header uses the root-authorized NIP-53 room-definition name and the fixed state **Connected in the room**; it must not infer venue identity from profiles or local copy.

## UI and interaction

- Header: signed room name in normal case and an explicit blue **Leave** text control. The oversized colored masthead, ticket shortcut, and duplicated room actions are absent. Directly below it, one compact status rail pairs a connection dot and **Connected/Connecting…** with **Leaving by &lt;time&gt;**. A kind-30312 room description is identity metadata, not a calendar event, so it is never placed in a **Right now**, event, or schedule slot. Venue events remain absent unless a future design consumes a trusted kind-31922/31923 projection explicitly.
- Room navigation: **People / Menu / Feed** appear in that order as text nav items with 48 dp targets. The selected item is communicated by selected accessibility state, blue text, and a two-pixel underline; tabs are never filled buttons or pills. People is the default. Room chrome and the selected section share one edge-to-edge vertical scroll container. Its content begins after the top inset and may scroll through that inset; its indicator uses the same top inset. The primary tab navigator, not Room, owns the bottom system inset.
- Live rails: a trusted active order, when present, is the yellow compact urgency strip. Quiet mode is one compact inline status, **Browsing quietly · Become visible**. Its green dot is decorative; the full state and action remain textual. The privacy explanation and visibility selection stay in the native join/privacy sheet instead of becoming a large card in the room.
- Roster: **People here (x)** precedes a vertically scrolling, wrapping portrait grid with four compact portrait cells on a normal phone and five inside the 620 dp expanded content width. Very narrow screens use three. Large text reduces that to two columns on compact/intermediate widths and four on expanded widths so names reflow instead of clipping. Only the display name is visual; intent and optional context remain in each card's accessible label. No per-person online dot or ellipsis action is rendered; roster membership is the only presence signal.
- A valid HTTP(S) `picture` from the latest kind-0 profile is the primary image.
  Missing, invalid, or failed pictures use one bundled Night Playlist portrait
  selected deterministically from the full pubkey. The same pubkey fallback is
  used by People, first contact, message request, and later conversation views,
  so roster changes or navigation never change a person's illustration. Portrait
  cards retain the native tall-cell aspect ratio and at least 48-point targets. No bundled venue
  photograph appears as current room or event evidence; this screen has no
  trusted event-image input.
- The visible count counts current, non-expired, explicitly visible presence projections only.
- Tapping anywhere on a portrait opens the native message-request sheet directly with the relay-derived public key. There is no separate three-dot route that pushes the room away; message requests and their dismissal remain in-screen. Blocking and reporting remain available from conversation controls, and feed posts retain their direct report action. No display name is used as identity.
- Beneath a populated roster, **Say hello to someone new** introduces an **Invite a friend / Share a link** row. It invokes the platform share sheet with a `crays:///join-room` link containing the pinned transport relay and room identifier. Dismissal or platform failure leaves the room unchanged and the row retryable.

## State and relay contract

`RoomSessionProvider` owns only the durable active-room selection. `RoomDataProvider` owns the live projection and gives each concurrent event family a stable room-scoped subscription ID on the one device transport URL. nipworker retains active native requests, wakes them after foreground, reconnects their relay, and owns the complete NIP-42 challenge/sign/replay exchange. The provider must not duplicate that connection state machine.

`ReactNativeBackend` restores its persisted signer asynchronously and emits the authoritative `auth` callback. The app binds that listener synchronously when it constructs the singleton manager, retains `{ pubkey, hasSigner }` for consumers that mount later, and compares the callback pubkey with the validated nipworker account. For an identified account, the provider registers the protected kind-4 request before opening public room families, preventing a public event from winning first-frame ordering on a new connection. Public People, Menu, Feed, trust, and entitlement reads do not wait for the private request's network EOSE and remain available if that private request fails. nipworker alone responds to any NIP-42 challenge. This ordering applies after a cold release launch and quiet entry as well as immediately after a visible join.

Visible-presence heartbeats publish directly through an effect-owned nipworker
handle. `ok`/`true` completes the refresh, `failed`/`false`/`error` logs the relay reason, and timeout,
room change, background cleanup, or provider unmount stops the exact handle.

Relevant events:

- NIP-53 kind `10312` with the exact `a=30312:<authorized-author>:<room-d>`;
- kind 0 profiles from the same relay;
- latest presence and latest profile win by `created_at`, then the NIP-01
  lowest-id tie-break;
- the presence event is the opt-in; `status=left`, an elapsed NIP-40 expiry,
  or a stale five-minute fallback window excludes it;
- missing profiles do not produce fabricated roster entries.

Presence is refreshed every 60 seconds and on foreground without extending the fixed automatic-leave time. FlatBuffer views are validated in the subscription callback and reduced to the smallest stable UI projection.

## Required states

- connecting: room chrome remains stable and states that the relay is connecting;
- populated: current visible profiles and exact count;
- quiet empty: explains that only opted-in visible people appear;
- visible empty: states that no visible profiles arrived yet;
- stale/left/quiet presence: excluded;
- expired room credential: transition to screen 21, never keep a stale roster interactive;
- relay failure: keep the selected room and offer retry/leave without inventing offline people.

## Accessibility and privacy

Name, intent, and context are text and may reflow under large type instead of
being clipped. Reading order is predictable despite the organic visual layout.
The compact room-status summary announces connection and expiry values as one coherent
unit. The visual information icon is decorative. No exact distance, table number, follower count,
profile-open count, or non-room activity is rendered. Quiet mode is never
visually treated as degraded access.

## QA strategy

Unit coverage in `RoomScreen.test.tsx` verifies edge-to-edge inset ownership, People-default route navigation, the
underlined text-tab treatment and order, live People count, populated and quiet-empty paths, direct message-sheet identity routing,
absence of per-avatar ellipsis actions, the share-link action, responsive non-horizontal roster, kind-0 picture handoff, compact accessible room-status summary, and the absence
of the kind-30312 description from event-like UI.
`NightPrimitives.test.tsx` verifies portrait and venue crop geometry. Native
workflow `maestro/flows/01-people.yaml` enters quietly through the real join
screen, proves People is the default pane, waits
for live relay projections, checks the exact visible-only count, and captures
the canonical state. It then kills and relaunches the app, proving that the
persisted room waits for nipworker's restored-signer callback before the menu,
roster, and feed refill.

`scenario:01-people` owns an independent lifecycle:

1. create an isolated Nuts coordinator relay and record its exact relay/volume IDs;
2. issue fixture membership awards through the same gate as production;
3. publish the root/admin-authored kind-30312 room definition plus signed profiles, room-bound NIP-53 presences, feed, catalog, membership, and event fixtures;
4. enter the room on Android using the emulator transport alias;
5. assert the screen consumed profile and presence FlatBuffers and did not
   present room metadata as a live event;
6. independently query every fixture, including the real kind-31923 calendar
   event used by My Night, and verify all Nostr signatures;
7. delete the exact relay and Docker volume in `finally`.

The hosted Test Room workflow `maestro/flows/test-room.yaml`, owned by
`scenario:test-room`, repeats the cold-relaunch check against the reserved
relay and independently verifies its room definition, invite award, visible
entry, and encrypted message write before teardown.

The relay-gate unit test proves that a matching protected request registration opens public room reads without waiting indefinitely for private EOSE, while a pending or mismatched request cannot disturb connection ordering. Additional implementation QA must cover: zero profiles, profile without presence, left replacement, expired/fallback-stale presence, newer/older/equal-time replacement ordering, malformed profile, wrong room `a`, reconnect, background/foreground heartbeat, and switching to a second relay without mixed roster data.

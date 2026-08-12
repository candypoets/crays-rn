# Screen 11 — Join privacy

## Product contract

Canonical visual reference: `docs/design-explorations/night-playlist/mockups/05-discovery-and-access-v1.png`, panel 04. The Night Playlist board's equal white choice cards and blue icon discs replace the incumbent selected-radio composition.

Purpose: separate selecting the one room relay from volunteering social
presence. Quiet is the safe default; becoming visible always requires an
explicit choice. Quiet users can read
announcements, menu listings, and available room data but never appear in
People. Writes and payment-dependent actions are separate and require whatever
authorization and payment contract the action defines. Visible users explicitly choose
Social, Business, Dating, or Just curious; may add an 80-character room-only
context. Visible presence is NIP-53 kind `10312`, linked to the exact
root-authorized kind-30312 room definition.

Primary action wording follows the current selection: **Enter quietly** or
**Enter and be visible**. Back leaves the current room selection unchanged.
Every entry chooses a one-, two-, or four-hour automatic leave time (two hours
by default). Repeated taps are disabled while entry/publish is in progress.

An entry may carry either a legacy invite-handoff URL or the direct service URL
and broadcast token from a version-2 Nearby pointer. Quiet entry deliberately
does not resolve or redeem either form. Visible entry validates the token and
community metadata against the pinned relay and NIP-97 trust chain, redeems it for the current account,
then independently reads the exact returned kind-8 award from the pinned relay.
The award must match the event id, token nonce, account, membership address,
root-delegated issuer, and live expiry rules before profile or presence is published.
Missing, expired, exhausted, wrong-room, issuer-mismatched, delayed,
and offline grants remain on this screen with a retryable error. Repeated entry
reuses the locally persisted nonce/account redemption and confirms it again.

The Test Room uses this same direct Nearby pointer in development and special
TestFlight builds. Its public token lasts 90 days with an effectively unlimited
safe-integer redemption count; redeemed test membership does not expire.

## Mutation and lifecycle

- Quiet: persist `ActiveRoom(visibility=quiet, leaveAt=…)`; open only that
  relay's room subscriptions; do not sign or publish kind `10312`.
- Granted visible entry: redeem only inside the visible branch and confirm the
  exact award against the NIP-11 root and root-signed anchor. The badge is
  authorization for the room and never implies visible presence by itself.
- Visible: after the room resolver has verified the NIP-11 root, root-signed
  anchor, and kind-30312 author, publish the local kind-0 profile, then
  sign/publish NIP-53 kind `10312` with the exact
  `a=30312:<authorized-author>:<room-d>`, the pinned relay hint, selected intent, bounded
  optional context, and automatic-leave expiry. Persist the room only
  after both writes receive a relay `OK`, so rejection cannot produce false
  local entry. Kind-0 remains the durable feed/persona projection; it is never
  presence by itself.
- On automatic leave, protected active-room state is removed, all room-scoped
  subscriptions are torn down, the feed locks, and the Room ended surface
  explains why. NIP-40 expiry removes visible presence without a social leave
  announcement; explicit leave writes a newer `status=left` kind-10312
  replacement. While active, the app refreshes presence every 60 seconds and
  on foreground without extending the fixed leave time.
- Any required publish succeeds after one intended relay accepts it. Rejection
  keeps a retryable state and must never show the user in People.
- Immediately after a confirmed invite award, profile and presence use a
  bounded retry window for the relay gate to observe the new NIP-97 award.
  This retry wrapper is never used without exact award confirmation, and
  exhausting the window remains a retryable screen error.
- Relay switch must complete old leave/lock before new selection.

## QA strategy

Unit tests prove the quiet default, explicit visible opt-in, intent/context selection, leave-time selection,
context bounding, and exact presence tags. Maestro loads the room from a real
signed kind-30312 room definition and exercises the complete choice surface.

Two mutation scenarios use a fourth badge-authorized identity that has no
fixture presence, avoiding the false proof created when the app identity is
also a seeded visible guest:

- `.qa/qa-11-join-quiet.mjs` enters through public UI and independently proves
  the app authored zero kind-10312 room events.
- `.qa/qa-11-join-visible.mjs` selects Business, exact context, and one hour;
  the independent verifier requires exactly one valid signature, exact
  room address/relay/root marker, the chosen fields, and an expiry matching
  that window. It also verifies the exact app-authored kind-0 profile that
  keeps People and feed projections resolvable.

Explicit leave and relay switching remain independently verified by screens 21
and 28. `.qa/qa-11c-join-relay-unavailable.mjs` covers the dead-relay path:
joining against an unreachable relay renders the unverified-room error state
and the enter action stays inert. The Test Room scenario additionally proves
the direct broadcast pointer, 90-day effectively unlimited credential,
non-expiring redeemed membership, exact award confirmation, room-bound
kind-10312 presence, and exact profile projection. Pure-logic
coverage proves that quiet visibility removes the invite source before any
network operation. Component/fake-clock coverage owns automatic local expiry; a future BLE
gateway harness must additionally force credential-renewal loss and verify the
Signal weak → Reconnecting → Room locked sequence.

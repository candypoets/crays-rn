# Screen 11 — Join privacy

## Product contract

Canonical visual reference: `docs/design-explorations/night-playlist/mockups/05-discovery-and-access-v1.png`, panel 04. The Night Playlist board's equal white choice cards and blue icon discs replace the incumbent selected-radio composition.

Purpose: separate selecting the one room relay from volunteering social
presence. Neither choice is preselected; the person must deliberately choose quiet or visible before confirmation is enabled. Quiet users can read announcements, order,
and use credentials but never appear in People. Visible users explicitly choose
Social, Business, Dating, or Just curious; may add an 80-character room-only
context; and publish one short-lived, room-scoped presence event.

Before selection the disabled action says **Choose how to enter**. Primary action wording then follows the current selection: **Enter quietly** or
**Enter and be visible**. Back leaves the current room selection unchanged.
Every entry chooses a one-, two-, or four-hour automatic leave time (two hours
by default). Repeated taps are disabled while entry/publish is in progress.

When discovery supplies an opaque invite-handoff URL, entry first retrieves
the unrendered token, validates its community metadata against the signed room,
and redeems it for the current account. Redemption must return a real kind-8
award before either quiet entry or visible presence continues. Missing,
expired, exhausted, wrong-room, issuer-mismatched, and offline grants remain on
this screen with a retryable error. Repeated entry reuses the locally persisted
nonce/account redemption and cannot consume the invite twice.

## Mutation and lifecycle

- Quiet: persist `ActiveRoom(visibility=quiet, leaveAt=…)`; open only that
  relay's room subscriptions; do not sign or publish kind `78` presence.
- Granted entry: redeem the handoff before the visibility branch. The badge is
  authorization for the room and never implies visible presence by itself.
- Visible: publish the local kind-0 profile, then sign/publish the versioned
  presence template with the exact room id, stable `d`, selected intent,
  bounded optional context, and automatic-leave expiry. Persist the room only
  after both writes receive a relay `OK`, so rejection cannot produce false
  local entry.
- On automatic leave, protected active-room state is removed, all room-scoped
  subscriptions are torn down, the feed locks, and the Room ended surface
  explains why. Natural NIP-40 expiry removes visible presence without a social
  leave announcement; explicit leave still writes the short-lived `status=left`
  replacement.
- Any required publish succeeds after one intended relay accepts it. Rejection
  keeps a retryable state and must never show the user in People.
- Relay switch must complete old leave/lock before new selection.

## QA strategy

Unit tests prove the no-default consent state, explicit quiet entry, intent/context selection, leave-time selection,
context bounding, and exact presence tags. Maestro loads the room from a real
signed manifest and exercises the complete choice surface.

Two mutation scenarios use a fourth badge-authorized identity that has no
fixture presence, avoiding the false proof created when the app identity is
also a seeded visible guest:

- `.qa/qa-11-join-quiet.mjs` enters through public UI and independently proves
  the app authored zero kind-78 room events.
- `.qa/qa-11-join-visible.mjs` selects Business, exact context, and one hour;
  the independent verifier requires exactly one valid signature, exact
  address/schema/room tags, the chosen fields, and an expiry matching that
  window.

Explicit leave and relay switching remain independently verified by screens 21
and 28. `.qa/qa-11c-join-relay-unavailable.mjs` covers the dead-relay path:
joining against an unreachable relay renders the unverified-room error state
and the enter action stays inert. The long-running Test Room scenario additionally proves hidden-handoff
redemption produced exactly one real issuer-signed, 24-hour kind-8 badge for an
identity that was not pre-authorized. Component/fake-clock coverage owns automatic local expiry; a future BLE
gateway harness must additionally force credential-renewal loss and verify the
Signal weak → Reconnecting → Room locked sequence.

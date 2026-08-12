# Crays mobile protocol contract

Status: pilot v1, implementation contract for the mobile app and its `.qa` fixtures.

## Why this contract exists

The PRD intentionally leaves room discovery, room presence, credential proof,
and room-feed retention open for focused protocol review. Screens must not
invent incompatible records ad hoc, so all unresolved fields are centralized
here and versioned. Established Nuts records remain unchanged.

## Established records

Entitlements follow **NIP-97** (Composable Entitlements and Community Access
Control; draft spec of record at `~/nips/97.md`). The trust root is the room
relay's NIP-11 `pubkey`; the root-signed community anchor declares admins and
the delegated `badge_issuer`. All entitlement events are resolved from, and
only from, the pinned community relay.

| Capability | Kind | Contract |
| --- | ---: | --- |
| Identity/profile | `0` | NIP-01 profile JSON. The current client republishes it to the pinned room relay on visible entry so People and feed posts remain attributable after presence ends. |
| Room presence | `10312` | NIP-53 regular replaceable presence, linked with `a=31727:<NIP-11-root>:community`, NIP-40 expiry, and bounded heartbeat freshness. |
| Room feed | `1` | NIP-29 `h=<room-id>` context plus NIP-40 `expiration`. |
| Community anchor | `31727` | NIP-97 anchor, `d=community`, root-signed: admin `p` tags, `badge_issuer`. |
| Membership definition | `30009` | NIP-58 definition with `t=membership`, optional NIP-99 `price` (recurrence in the 4th element) and `permission` tags. |
| Product, pass, ticket definition | `30402` | NIP-99 listing (`title`, `summary`, `price`, `availability`, `max_uses`); a ticket links its calendar event with `a`. |
| Event | `31922`, `31923` | NIP-52 calendar event; also its own free-admission definition. |
| RSVP | `31925` | NIP-52 RSVP. |
| Ownership/order award | `8` | NIP-58 award with `a`, `p`, semantic `order`/`event` context, and `t` query hints (definition kind plus finer topic). |
| Order/check-in state | `37237` | Addressable NIP-97 status with semantic context and matching `d`; read legacy `27237`. |
| Presentation | `27236` | Short-lived Nuts presentation; never treat the QR alone as fulfillment. |
| Wallet | `17375`, `7375`, `7376` | NIP-60 encrypted wallet, proofs, and optional history. |

NIP-97 issuance rules apply: anchor admins may award any definition; the
`badge_issuer` may award sellable (priced) definitions only. Award revocation
is a NIP-09 kind `5` from the award issuer or an anchor admin. Fulfillment
signers are anchor admins or the `badge_issuer` (the relay write gate enforces
37237-write role holders relay-side).

## Community identity and unresolved dynamic records

### Authoritative community metadata — kind `31727`

Community identity and trust come from the NIP-11 root key and that root's
current NIP-97 anchor. The anchor's `name`, `description`, and `image` are the
core display metadata; its `p` and `badge_issuer` tags are the authority set.
A client MUST NOT label a room or community verified merely because an
operator self-signed an app-data event.

The NIP-97 anchor does not itself define geospatial indexing, live/open state,
or a multi-room hierarchy. Those remain open protocol decisions, not fields to
smuggle into arbitrary app-data records. Social presence uses the explicit
NIP-53 binding below.

Participant display metadata and live presence have different lifetimes and
MUST remain separate. Kind `0` is the current durable display projection: it
keeps names, avatars, and feed attribution available after a person leaves.
Removing it without a durable room-persona replacement would turn historical
posts into anonymous pubkeys. Presence is the short-lived, volunteered state
that controls roster inclusion; it must not be inferred from kind `0` or from
a non-expiring membership award.

### Room presence — NIP-53 kind `10312`

Visible entry publishes a NIP-53 regular replaceable event with an exact root
link:

```text
["a", "31727:<NIP-11-root>:community", "<pinned-relay-url>", "root"]
```

The event has empty content, selected `intent`, optional `context` bounded to
80 characters, and NIP-40 `expiration` equal to the user's fixed automatic
leave time. Presence is refreshed every 60 seconds and when the app returns to
the foreground; a refresh never extends that leave time. Interoperable NIP-53
events without `expiration` receive a five-minute client freshness window.
The event itself is the visible opt-in—there is no `visibility` tag.

Explicit leave publishes a newer kind-10312 replacement with the same anchor
`a`, `status=left`, and the original scheduled expiry (or at least a short
future bound if that time already passed). The roster applies NIP-01
replacement ordering: newest `created_at`, then lowest event id. It accepts
only the exact current anchor address. Kind `0` remains separate, durable
display/feed metadata and is never interpreted as presence.

This contract deliberately supports the current invariant of one physical
room/community relay per active session. Because kind `10312` allows only one
current room per author on a relay, a future community containing multiple
simultaneous physical rooms needs an anchor-authorized room-address schema and
a coordinated migration. It must not reuse the legacy discovery selector as a
presence address.

### Deprecated Crays discovery pilot — not a protocol contract

The current app still contains a compatibility reader for:

- kind `30078`, `d=life.crays/room/v1/<room-id>`, previously called a room
  manifest.

Upstream defines `30078` as arbitrary addressable application data, normally
for custom client/user state that does not require interoperability. That does
not give the Crays selector community or discovery semantics. The legacy
selector is a migration liability only:

- do not add new writers, indexers, relay policies, or integrations that treat
  either shape as authoritative;
- do not introduce another `30078` proximity credential;
- do not use a legacy manifest signature as community trust proof;

### Remaining protocol decisions

Before replacing the legacy paths, a NIP-97-compatible proposal must decide:

- geographic discovery: event kind/schema, signer authority, relay indexing,
  precision/privacy, expiry, and whether one community can expose many rooms;
- participant persona: retain standard kind `0` as the durable identity
  projection, or—only if room-specific names/privacy are a product
  requirement—standardize a separate addressable room-persona kind. Do not
  overload the short-lived presence record with durable feed metadata;
- proximity: what the BLE transport advertises, what is merely a pointer or
  bearer invite, and whether any signed Nostr proof is needed at all.

The BLE Test Room pointer is transport input only. NIP-11 plus the `31727`
anchor and NIP-97 entitlement events remain the authority; the pointer does
not create a Nostr discovery or presence namespace.

## Required client invariants

1. Exactly one room relay owns room-scoped subscriptions at a time.
2. A room switch writes/observes leave before the old subscriptions close and
   before the new room becomes active.
3. Expired feed and stale/expired/left NIP-53 presence are ignored client-side.
4. Success requires at least one relay acceptance; a rendered success state is
   never independent protocol proof.
5. Unknown schema versions render an unsupported state, never Verified.
6. Durable messages, awards, orders, memberships, tickets, and wallet state do
   not disappear when room presence ends.

## Migration

The `30078` selector must not be silently reinterpreted. Community metadata
migrated to the root-and-anchor projection first. Presence uses only
anchor-bound kind `10312`, with no dual read/write compatibility path.
Geographic discovery still needs its own approved migration away from the
remaining selector.

### NIP-97 cut-over

The entitlement substrate moved from the venue-custom model (everything on
`30009` with `type` tags, trust from the manifest `operator`/`award_issuer`
tags) to NIP-97 in one clean cut: pilot QA relays are freshly provisioned per
scenario, so no dual-read of `30009 type=*` data was kept. The manifest
`award_issuer` tag is parsed for interop but no longer trusted; entitlement
trust derives from the NIP-11 root key and the anchor. Local entitlement/order
archives were versioned (`crays.orders.archive.v2`,
`crays.entitlements.archive.v2`) so pre-NIP caches are abandoned, not read.

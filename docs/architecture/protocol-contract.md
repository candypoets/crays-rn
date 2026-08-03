# Crays mobile protocol contract

Status: pilot v1, implementation contract for the mobile app and its `.qa` fixtures.

## Why this contract exists

The PRD intentionally leaves room discovery, room presence, credential proof,
and room-feed retention open for focused protocol review. Screens must not
invent incompatible records ad hoc, so all unresolved fields are centralized
here and versioned. Established Nuts records remain unchanged.

## Established records

| Capability | Kind | Contract |
| --- | ---: | --- |
| Identity/profile | `0` | NIP-01 profile JSON. |
| Room feed | `1` | NIP-29 `h=<room-id>` context plus NIP-40 `expiration`. |
| Event | `31922`, `31923` | NIP-52 calendar event. |
| RSVP | `31925` | NIP-52 RSVP. |
| Product, pass, membership, ticket definition | `30009` | Nuts badge-definition tags (`type`, `t`, `name`, price and availability). |
| Ownership/order award | `8` | NIP-58 award with `a`, `p`, and semantic `order` or `event` context. |
| Order/check-in state | `37237` | Addressable Nuts status with semantic context and matching `d`; read legacy `27237`. |
| Presentation | `27236` | Short-lived Nuts presentation; never treat the QR alone as fulfillment. |
| Wallet | `17375`, `7375`, `7376` | NIP-60 encrypted wallet, proofs, and optional history. |

## Versioned Crays pilot records

NIP-78 is used precisely because these shapes are not standardized yet. The
namespace is `life.crays`; clients must reject an unknown schema version.

### Room manifest/highlight — kind `30078`

- `d=life.crays/room/v1/<room-id>`
- `schema=life.crays/room/v1`
- `name`, `about`, `picture`, optional `banner`
- `relay=<wss-url>` and `operator=<pubkey>`
- `g=<geohash>` only at the precision required for the map viewport
- repeated `capability` tags (`social`, `menu`, `events`, `membership`)
- `open=<open|closed>` and `expiration=<unix-seconds>`
- signer must equal the operator identity trusted for that relay

The search relay may index this event but is not its authority. The client
verifies signature, operator, relay URL, and expiry before showing Verified.

### Presence — kind `78`

- `d=life.crays/presence/v1/<room-id>/<pubkey>`
- `schema=life.crays/presence/v1`, `type=presence`, `h=<room-id>`
- `visibility=visible` only when the person explicitly opted in
- `expiration=<unix-seconds>`; clients ignore expired entries even if retained
- leaving writes `status=left` with a near-term expiration

Quiet browsing never publishes this record. Presence is stored only on the
selected room relay and is not a location-proof or a durable attendance log.

### Proximity credential — kind `30078`

- `d=life.crays/credential/v1/<room-id>/<nonce>`
- signed by the room operator, short-lived, and bound to the advertised
  challenge and room manifest hash
- presented during NIP-42/relay access negotiation, never rendered as social
  presence by itself

The pilot harness does not claim BLE anti-relay security; it proves expiry,
room binding, signer binding, and one-active-room subscription behavior.

## Required client invariants

1. Exactly one room relay owns room-scoped subscriptions at a time.
2. A room switch writes/observes leave before the old subscriptions close and
   before the new room becomes active.
3. Expired feed, presence, discovery, and credentials are ignored client-side.
4. Success requires at least one relay acceptance; a rendered success state is
   never independent protocol proof.
5. Unknown schema versions render an unsupported state, never Verified.
6. Durable messages, awards, orders, memberships, tickets, and wallet state do
   not disappear when room presence ends.

## Migration

When a standard replaces one of these pilot records, add a dual-read period,
write only the new shape, independently verify both projections, then remove
pilot reads in a named protocol version. Never silently reinterpret v1 data.

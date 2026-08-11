# Durable entitlement workflow architecture

Source lineage: the member-side projection/presentation flow in `nuts-rn` and
the staff derivation/scanner flow in `nuts-cash`. This document records the
portable behavior Crays must preserve; it does not make the mobile cache or UI
authoritative.

## Workflow boundary

```text
name: Venue-issued products, tickets, memberships, and multi-use passes
includes: definition discovery; ownership; status/revocation projection;
          durable archive; list/detail/activity; live signed presentation
excludes: payment capture; staff fulfillment UI; scanner replay database;
          role administration; mint/wallet behavior
entry points: Me, My night, Tickets, Memberships & passes, order detail
exit points: object detail, live QR presentation, venue support
```

## Purpose and handoff goal

The holder sees the same kind-8 award, its addressable definition (30009
membership or 30402 listing), and kind-37237 fulfillment truth that staff sees. Finite uses are derived from the latest valid
status in each fulfillment context. A usable object can create a short-lived,
holder-signed kind-27236 QR; no durable award or local cache is itself a QR.

An implementation must preserve state ownership, subscription cleanup,
signer/issuer trust, side-effect lifecycle, and all invariants below. Framework,
file layout, and UI primitive choices may differ.

## Architectural units

```text
Venue subscription owner
  role: Subscription
  owns: live request handles and EOSE/connectivity state
  receives: one authoritative relay and the kind-31727 community anchor
  emits: validated definitions, awards, statuses, revocations
  must not own: use counters or purchase success

Projection coordinator
  role: Coordinator
  owns: stable copied projections and derived state
  receives: validated relay events and current clock
  emits: orders and entitlements
  must not own: staff mutations or scanner acceptance

Durable archive
  role: Repository
  owns: last verified stable projection per award
  receives: live projections
  emits: offline/list/detail inputs
  must not own: new status, restored uses, or payment state

Presentation coordinator
  role: Service
  owns: signing generation, refresh timer, cancellation flag
  receives: usable entitlement and active identity signer
  emits: signed QR payload or explicit failure
  must not own: award issuance or fulfillment

List/detail/presentation views
  role: Screen/View
  owns: selection and fullscreen state only
  receives: projected objects and actions
  emits: navigation/presentation intent
  must not own: counters, trust decisions, or relay writes
```

## Screen hierarchy and boundaries

```text
Root data provider
  Venue subscription owner
  Projection coordinator
  Durable archive

Me / My night
  Memberships & passes list -> Membership/pass detail
  Tickets list              -> Ticket/RSVP detail
  Orders list               -> Order detail

Entitlement detail
  Status summary
  Presentation coordinator -> White QR card -> Fullscreen QR
  Activity ledger
  Management/support boundary
```

Parents pass stable IDs or immutable projections. Rows emit the selected award
ID. Detail resolves by award ID; display name is never an identity key. The
presentation child emits no commerce mutation and owns only ephemeral QR state.

## State model

```text
source state:
  definitions by their address (30009/30402)
  awards by kind-8 event ID
  statuses by event ID
  revocations by target award ID and issuer
  trust anchors from the kind-31727 community anchor

derived entitlement state:
  active | available | exhausted | expired | revoked | cancelled
  remaining uses = max(0, max_uses - fulfilled latest contexts)
  activity = newest valid status in each order/event context

transient presentation state:
  idle | signing | live | unavailable | failed | disposed
  payload, last error, generation number, refresh timer, fullscreen

external handles:
  one subscription per event family; one signer callback per refresh
```

## Event sources and state machine

```text
route/create -> load archive and start relay subscriptions
relay definition -> validate anchor-admin author and upsert by address/event freshness
relay award -> validate holder and anchor-authorized issuer role; upsert by ID
relay status -> validate holder/address/award/context/status and authorized signer
relay deletion -> accept revocation only from the award issuer or an anchor admin
clock tick -> recompute expiry
leave/offline -> dispose live room handles; retain verified archive

detail idle -> signing when presentable
signing -> live after valid signer result; schedule refresh at 60 seconds
signing -> failed on signer error; show text, no stale-valid claim
live -> signing on refresh while mounted and usable
any -> unavailable on expiry/revocation/exhaustion/cancellation
any -> disposed on unmount; cancel timer and ignore late signer callbacks
```

## Data contracts

```text
Definition event:
  kind: 30009 (membership) or 30402 (product/pass/ticket)
  identity: address <kind>:<definition author>:<d>
  required: d, name (30009, bare t=membership topic) or title (30402)
  optional: description, NIP-99 price (billing recurrence rides its 4th
            element), event address, max_uses, expiration

Ownership event:
  kind: 8
  required: a=definition address, p=holder
  trust: author is an anchor admin, or the badge_issuer for a sellable
         definition
  optional: order, i/payment reference, expiration

Status event:
  kind: 37237 (27237 read-only migration compatibility)
  required: status, a, e=award, p=holder, exactly one order/event context
  addressability: d=order:<id> or event:<coordinate>
  trust: anchor admin or badge issuer signer

Revocation event:
  kind: 5
  required: e=award
  trust: deletion author equals that award's issuer or is an anchor admin

Presentation event:
  kind: 27236
  required tags: type=nuts_entitlement_presentation, expiration, nonce,
                 e=award, a=definition, r=authoritative relay,
                 exactly one order/event context
  lifetime: 90 seconds; refresh while visible at 60 seconds
  QR: nuts:present:<base64url(JSON(signed event))>
```

## Data flow and side effects

```text
community anchor (kind 31727)
  -> one relay per subscription family
  -> FlatBuffer event validation inside callback
  -> minimal stable copy
  -> deterministic latest-per-context derivation
  -> encrypted device archive
  -> list/detail projection
  -> presentability guard
  -> active signer
  -> white QR card
  -> staff scanner verifies signature, window, award, revocation, and uses
```

Subscription ownership ends on relay/room/identity change or provider disposal.
Archive writes are idempotent by award ID and never increase a counter on their
own. Presentation signing has no relay publish side effect. Failures retain the
last verified object state but remove any claim that an expired QR is valid.

## Routing and lifecycle

```text
/memberships -> list -> /membership-detail?awardId=<64 hex>
/tickets     -> list -> /ticket?awardId=<64 hex>
/orders      -> list -> /order?ref=<venue reference>

create: resolve stable ID from live plus archive
active: sign/refresh only if presentable
suspend: UI may retain object; presentation must not be called valid past expiry
resume: recompute clock and sign fresh
destroy: clear interval; invalidate pending generation; dispose subscriptions
```

## Errors, empty states, and recovery

- Missing definition: withhold the entitlement; never infer type from award text.
- Wrong holder/issuer/status signer: discard and record diagnostic evidence only.
- Relay offline: show last verified object with offline wording; never invent uses.
- Missing award: show unavailable and return to list.
- Expired/revoked/exhausted/cancelled: retain history; disable presentation in text.
- Signer failure: show “could not prepare a live code” and retry on remount/refresh.
- QR refresh failure: do not describe the previous expired payload as usable.
- Legacy status: read 27237 during migration; write no legacy events.

## Domain invariants

1. Only the venue/admin relay objects are commerce truth; the mobile archive is
   a last-verified projection.
2. A definition address, award ID, holder, and status references must all match.
3. A status counts once per context; newest `created_at` wins, then lowest event
   ID breaks a same-second tie.
4. A cancellation that is latest for a context removes that context from the
   fulfilled-use count.
5. Revocation is valid only from the award issuer or an anchor admin.
6. Expiry/revocation takes precedence over remaining-use presentation.
7. Membership/pass presentations use a fresh `use:` context; event tickets use
   the event coordinate; products use the purchase/order reference.
8. The QR carries the signed authoritative relay, not a device proxy URL.
9. There is exactly one order or event presentation context.
10. Presentation is short-lived holder proof, not payment, fulfillment, or an
    anonymous bearer token.

## Implementation and acceptance checks

1. Subscribe with distinct deterministic subscription IDs; prove no NIP-01 REQ
   replaces another event family.
2. Validate and copy minimal event fields inside the nipworker callback.
3. Project latest statuses and remaining uses with pure unit tests including
   same-context rollback, tie-break, finite/unlimited, expiry, and revocation.
4. Persist/relaunch and leave-room tests must retain objects but not live feed.
5. Render active/inactive grouping, explicit text state, validity, holder,
   remaining count, activity, and management boundary.
6. Sign a 27236 through the active nipworker signer, refresh, dispose safely,
   and independently verify event signature/tags/window from device log output.
7. Staff scanner QA must reject wrong holder/issuer/address, replay, expired,
   future, revoked, exhausted, and already-fulfilled event presentations.
8. Native accessibility QA must reach a relevant pass/ticket in two taps,
   preserve a white quiet zone, scale text, and expose non-color status labels.

Unresolved trust-role, replay, clock, offline-scanner, brightness, issuer rotation,
and iOS requirements are tracked as D-010/D-011 in `docs/DESIGN-DEBT.md`.

# Crays design-debt and external-contract register

This is the authoritative list of work that cannot be completed honestly in
the mobile repository. Disabled or unavailable UI is intentional when it maps
to an item below. Close an item only with a production contract and independent
QA evidence; never replace it with a local success mock.

## D-001 — Search relay discovery

**Blocked on:** signed listing kind/schema, geo index, viewport/category/text
queries, pagination, deterministic non-popularity ranking, operator publishing
authorization, freshness, moderation, retention, and federation. Search results
must resolve to the same pinned relay and root-authorized kind-30312 address the
client verifies before showing **Verified room**.

**Evidence to close:** disposable search-relay tests for valid, expired, forged,
mismatched, duplicate, paginated, empty, and unavailable results. BLE/QR direct
entry must survive outage without changing the active room.

## D-002 — BLE challenge and relay credential

**Blocked on:** compact-ID versus direct-GATT layout, rotating nonce cadence,
kind-30312 address/event binding, NIP-42 authentication, challenge proof, renewal tolerance,
replay controls, and **Signal weak → Reconnecting → Room locked** timing. Direct
GATT pointer reading and foreground scanning exist; a credential is not mocked.

**Evidence to close:** physical Android/iOS gateway tests for multiple beacons,
replay/relay attacks, stale nonce, changed room definition, denied permission, radio
loss/recovery, expiry, QR fallback, and no scanning outside documented windows.

## D-003 — Presence and room-feed pilot protocol

**Blocked on:** retention, credential enforcement, pin/moderation roles,
own-post retention, and migration of the remaining versioned feed payloads.
Room identity and presence already use NIP-53 kinds 30312 and 10312.

**Evidence to close:** relay policy/security tests for quiet zero-write, visible
replacement/leave/expiry, read/write denial after lock, trusted moderation, and
migration.

## D-004 — Remote message-request policy and rate limits

**Blocked on:** signed preferences for mutual contacts/intent/nobody, contact
proof, sender-recipient-room limits, ignored retention, gift-first-contact policy,
and enforcement location. NIP-04 kind-4 consent and local duplicate suppression
exist. Production DM relays must authenticate reads because metadata is visible.

**Evidence to close:** two-device malicious-client tests for every policy,
duplicate/replay/rate-window handling, blocks, and metadata access denial.

## D-005 — Moderation operations

**Blocked on:** reason taxonomy, minimum evidence, encryption/redaction,
retention, trusted moderator roles, acknowledgement/resolution, appeals, and
emergency escalation. Exact kind-1984 reports and venue/global blocks exist.

**Evidence to close:** staff lifecycle tests for unauthorized access, evidence
minimum, retention expiry, role removal, resolution notification, and scope.

## D-006 — Payments, checkout, receipts, cancellation, refunds

Self-order card checkout now uses the shared Nuts hosted Stripe service and
the live payment-to-kind-8 redemption path. Remaining decisions include
merchant and tax data, modifiers/tip/fulfillment, multi-line and quantity
checkout, idempotency across a real Stripe session, uncertain-order recovery,
cancellation, original-rail refunds, receipts, gift accept/decline, and alcohol
eligibility. Cashu, gift checkout, and membership/event checkout remain
explicitly unavailable.

**Evidence to close:** processor sandbox plus relay tests for success, decline,
kill-after-capture, duplicate tap, timeout/recovery, cancellation/refund states,
gift accept/decline, receipts, and exactly-once commitment.

## D-007 — Cashu wallet and NIP-60/61

**Explicitly unavailable.** Select mints/trust policy and NIP versions; design
the encrypted local database, relay set, proof reservation/spend journal,
conflict quarantine, Lightning quotes, fees/limits, receive/refund, backup, and
new-device recovery. No balance or proofs are fabricated.

**Evidence to close:** mint fault-injection tests for double-spend prevention,
crash at every boundary, duplicate/stale events, quote expiry, mint/melt
uncertainty, refund, wrong identity, recovery, and zero balance disclosure.

## D-008 — Custody, import, providers, and recovery

**Explicitly deferred beyond device-only SecureStore.** Define Apple/Google to
Nostr binding, encrypted custody, unlock, link/unlink, remote signer, safe import,
recovery proof, portability, lost-provider behavior, and object continuity.

**Evidence to close:** threat model and multi-device tests for duplicate identity,
wrong account, cancelled OAuth, provider loss, signer timeout, secure export,
recovery, and resuming interrupted intent.

## D-009 — Push notifications

**Blocked on:** encrypted device-token registration, relay trigger service,
deduplication, controls/quiet hours, permission timing, content privacy, deep
links, token deletion, and operational-update limits.

**Evidence to close:** physical-device foreground/background/terminated tests
for every high-value event, denial, duplication, logout, blocks, and exact links.

## D-010 — Entitlement trust and scanner operations

**Partially implemented:** anchor-admin kind-30402/30009 definitions, NIP-97
anchor trust (NIP-11 community root plus delegated badge_issuer), admin/issuer
37237 statuses, kind-5 revocations by award issuer or anchor admin, finite-use
30402 (`max_uses`) derivation, and signed 90-second kind-27236 presentations.
Still define general authorized status roles, replay storage, clock tolerance,
offline policy, brightness boost, capacity, issuer rotation, legacy 27237
sunset, and revocation SLA.

**Evidence to close:** mobile/scanner tests for role removal, wrong issuer/holder/
address, replay/expiry/future clock, offline scanner, rotation, live revocation,
final pass use, status rollback, and two-tap accessibility on Android and iOS.

## D-011 — iOS parity and accessibility certification

**Blocked on device matrix:** iOS BLE/deep-link/SecureStore/QR behavior; Dynamic
Type, VoiceOver, Reduce Motion, contrast, and 48×48-point targets. Repeat with
TalkBack and Android font/display scaling.

**Evidence to close:** recorded supported-OS matrix with no clipped actions,
logical reading order, text status labels, reduced motion, QR quiet zone, and
permission fallbacks.

## D-012 — Production telemetry and data minimization

**Blocked on:** aggregate event schema, consent, retention, venue separation,
failure telemetry, deletion, and forbidden fields. Never log keys, DM plaintext,
wallet data, precise movement, or a person-level venue history.

**Evidence to close:** schema/privacy review, automated forbidden-field checks,
opt-out/deletion tests, and proof that logs cannot reconstruct those data.

## D-013 — Subscription ownership and projection cache

**Needs architectural design:** the current active-room provider owns distinct
NIP-01 subscription IDs for presence, profiles, feed, catalog, events, awards,
statuses, and revocations. That is correct for avoiding REQ replacement, but it
keeps every family live while any room screen is mounted and mirrors their event
projections in one app-wide context. Before production scale, split this into
screen-family subscriptions (People, Feed, Commerce, Events, Entitlements) over
a small normalized cache keyed by signed event/address. Durable archives remain
separate and must always be revalidated against relay truth.

**Evidence to close:** navigation instrumentation proving only the visible
screen family and required durable background family own live subscriptions;
rapid-tab, relay-switch, foreground/background, EOSE-with-zero-events, duplicate,
replaceable-event, deletion, reconnect, and memory-bound tests. No screen store
may become a second source of truth or leak a prior room's projection.

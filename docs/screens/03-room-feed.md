# 03 — Room feed

## Product contract

This is Crays Mobile's only public feed. It reads and writes against exactly the active room relay and locks when the room credential expires. It is chronological, concise, and has no repost race, recommendation algorithm, popularity rank, or global-feed escape.

## UI and interaction

- Fixed venue context and **Live from this room · locks when you leave** consequence.
- One composer, maximum 500 characters for the pilot.
- Venue announcements are text-labelled, not color-only.
- Posts offer Message and Report; reply can be added against the same room credential.
- Menu, My night, Leave, and People use the same room chrome as screen 01.

## Relay contract

Read kind 1 with `#h=<active room id>` from only `connectionRelayUrl`. Require non-empty ID, pubkey, content, and a future NIP-40 `expiration` when present. Display newest first; relay arrival order must not reorder history incorrectly.

Resolve each author from the latest kind-0 profile on that same pinned relay.
Kind-0 is display metadata, not evidence that the author is currently present;
it intentionally remains usable after presence ends so existing feed posts do
not lose their name and avatar. A missing profile may fall back to **Room
guest** in the feed, but it must never fabricate a name or make the author
appear in People.

Publish with `roomFeedTemplate`: kind 1, room `h`, `client=life.crays`, and expiration no later than the active room's expiry. The configured nipworker signer signs; success is shown only after one target relay explicitly returns OK. A false response or timeout preserves the draft and offers retry. The screen never provides a second send path while an outcome is uncertain.

## Required states

- connecting/loading, empty, populated, venue announcement, guest post;
- local composer empty, max length, publishing, confirmed, rejected, timeout, reconnect;
- malformed content, wrong `h`, expired post, older duplicate;
- room credential expires while composing or publishing;
- quiet visitor may read; write still requires the relay's authorization gate;
- after leave, replace with screen 21 and retain only opted-in private activity.

## Accessibility and safety

Announcements have an explicit label. Author buttons announce names. Content follows text scaling and is not clipped. Report is reachable without opening a profile. No engagement counts or ranking signals are exposed.

## QA strategy

Unit tests verify announcements, composer, feed content, and publish failure. `maestro/flows/03-room-feed.yaml` joins through the real manifest, selects Room feed, and asserts both an operator announcement and guest post planted on the isolated relay.

`.qa/qa-03-room-feed.mjs` independently provisions, seeds, queries, verifies, and destroys a Nuts relay. It uses an authorized QA signer, publishes an exact post through UI, and independently proves kind, signature, room/client/expiry tags and content. It also reports a selected Jonas post and proves the report's exact `e`, `p`, and venue tags. Component QA owns retained-draft/rejection and disabled-publish behavior. Credential-timeout enforcement remains D-002/D-003.

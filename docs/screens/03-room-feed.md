# 03 — Room feed

## Product contract

Canonical visual reference: `docs/design-explorations/night-playlist/mockups/01-room-and-feed-v1.png`, panel 03. This Night Playlist board supersedes the incumbent dark feed PNGs for visual treatment; relay truth and ordering below remain authoritative.

This is Crays Mobile's only public feed. It reads and writes against exactly the active room relay and locks when the room credential expires. It is chronological, concise, and has no repost race, recommendation algorithm, popularity rank, or global-feed escape.

## UI and interaction

- Fixed venue context, the same compact **Connected / Leaving by** status rail as People, and the explicit **Chronological · locks when you leave** consequence. The kind-30312 room description never occupies an event-like slot.
- A prominent **Post to this room** row opens the dedicated screen-03a modal. The timeline never grows an inline editor or lets a keyboard obscure another note.
- Each kind-1 note uses a compact social card informed by `nuts-rn`'s note anatomy: a 44dp portrait (or room megaphone), author and time on one wrapping header line, readable text and up to four images, then Reply, Like, Message, and Report actions. Counts are factual projections of room-relay events, never ranking inputs.
- Venue announcements use the same card anatomy with an explicit **Announcement** label and icon, never color alone. Guest notes use white cards and a deterministic portrait fallback. There is no decorative timeline rail competing with the note content.
- Tapping the note body opens screen 03b, a focused thread rooted at that note. Reply opens screen 03a with the selected note visible. Like publishes once and becomes disabled after this identity's confirmed or observed reaction; Crays does not invent unlike semantics for a non-replaceable kind-7 event.
- People, Menu, and Feed use the same underlined text navbar as screen 01 inside the edge-to-edge Room scroll surface; Feed retains its selected state when revisiting the Tonight primary tab. Leave remains in shared room chrome; active order urgency is the only shortcut above the room sections.

## Relay contract

Read NIP-01 kind 1 with `#h=<active room id>` from only `connectionRelayUrl`. Require non-empty ID, pubkey, content, and a future NIP-40 `expiration` when present. Display newest first; relay arrival order must not reorder history incorrectly. The screen keeps the existing minimal stable projection because posts outlive nipworker callback buffers; it does not unpack or mirror the full parsed event tree.

The main timeline contains root notes only. Marked NIP-10 replies remain in the same room-scoped subscription but are projected into their root thread. Direct replies carry one `e` root marker; nested replies carry root then reply markers plus the involved `p` tags. Kind-7 likes are read from a separate deterministic `room_reactions_<room>` subscription filtered by `#h`; unique author pubkeys determine the displayed count.

Resolve each author from the latest kind-0 profile on that same pinned relay.
Kind-0 is display metadata, not evidence that the author is currently present;
it intentionally remains usable after presence ends so existing feed posts do
not lose their name and avatar. A missing profile may fall back to **Room
guest** in the feed, but it must never fabricate a name or make the author
appear in People.

Publish notes and replies through screen 03a with kind 1, room `h`, `client=life.crays`, and expiration at the local automatic-leave boundary. Publish likes with kind 7, `content=+`, target `e`/`p`/`k` hints, the same room and expiry tags, and only the pinned room relay. The configured nipworker signer signs; success is shown only after one target relay explicitly returns OK. False response and timeout keep the relevant action retryable.

The route owns independent nipworker publish handles for posting and reporting.
It treats `failed`/`false`/`error` as a terminal relay response and displays `message()`
immediately; each handle is stopped after `ok`/`true`, rejection, timeout, or unmount.

## Required states

- connecting/loading, empty, populated, venue announcement, guest post, text post, image post;
- composer entry, like pending/confirmed/rejected/timeout, reply and thread navigation;
- malformed content, wrong `h`, expired post, older duplicate;
- room credential expires while composing or publishing;
- quiet visitor may read; write still requires the relay's authorization gate;
- after leave, replace with screen 21 and retain only opted-in private activity.

## Accessibility and safety

Announcements have an explicit label. Author buttons announce names. Image alternatives come from NIP-94 metadata with a safe fallback. Content follows text scaling and is not clipped. Every footer icon has a full action/author/count label and a 48dp target. Report remains reachable without opening a profile. Engagement counts never affect ordering.

## QA strategy

Unit tests verify announcements, root-only ordering, image rendering, engagement projection,
like locking, thread/reply entry, and report-action locking. `maestro/flows/03-room-feed.yaml` joins through the
real root-authorized room definition, selects Room feed, proves the room
description is absent from event-like UI, and asserts both an operator announcement and
guest post planted on the isolated relay. It then publishes a root note and NIP-10 reply,
likes the selected fixture note, opens its thread, and reports it.

`scenario:03-room-feed` independently provisions, seeds, queries, verifies, and destroys a Nuts relay plus an isolated Blossom-compatible upload adapter. It uses an authorized QA signer and independently proves the root kind-1, image kind-1, marked reply, kind-7 like, and report signatures plus their room/client/expiry/reference tags. It also verifies the uploaded bytes, kind-24242 authorization, hash, MIME, and matching `imeta`. Screen 03a tests own retained-draft/rejection and disabled-publish behavior. Credential-timeout enforcement remains D-002/D-003.

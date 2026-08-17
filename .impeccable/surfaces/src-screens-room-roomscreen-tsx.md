---
version: 1
slug: "src-screens-room-roomscreen-tsx"
primary_target: "src/screens/room/RoomScreen.tsx"
related_targets: ["src/screens/room/RoomPostScreen.tsx","src/screens/room/RoomThreadScreen.tsx","src/screens/room/RoomNoteCard.tsx"]
---

Scope: the room Feed, its focused post/reply composer, and its thread detail; Operate mode.

Audience/job: a guest who is physically in a room needs to scan short room-scoped notes, add a lightweight response or appreciation, follow one conversation without losing context, and share a moment from the room.

Action and proof: compact chronological kind-1 cards foreground identity, time, copy, and optional imagery. Reply and Like stay in a quiet action row with visible engagement counts; tapping the note body opens a focused root-and-responses thread. The dedicated modal keeps root posts and replies intentional, retains failed drafts, and closes only after the pinned room relay accepts the signed event. Blossom previews and upload progress prove what will be shared before publication.

Direction: inherit Crays Night Playlist and the existing room palette, with the density and conversational directness of Nuts' kind-1 feed rather than introducing a separate social-network shell. White cards, restrained borders, strong author hierarchy, small semantic accents, and generous 48-point actions keep the room feeling immediate but calm. The memorable moment is moving from a lively room feed into one clean conversation and back without losing place.

Constraints: every note, reply, reaction, and report stays scoped to the pinned room relay and session expiry; never imply global Nostr publication. Preserve NIP-10 root/reply markers, kind-7 reaction semantics, content-addressed Blossom metadata, large text wrapping, reduced-motion safety, attachment limits, and useful loading/empty/error/retry/disabled states. Do not mirror subscription buffers into a global store or create another manager.

---
version: 1
slug: "src-screens-room-roomscreen-tsx"
primary_target: "src/screens/room/RoomScreen.tsx"
related_targets: ["src/screens/room/RoomPostScreen.tsx","src/screens/room/RoomThreadScreen.tsx","src/screens/room/RoomNoteCard.tsx"]
---

Scope: Tonight / Inside and After, including People, Menu, Feed, live order urgency, quiet-presence truth, explicit leave, and the settled Room ended state under the persistent tab bar; Operate mode.

Audience/job: a guest inside one verified room needs to know where they are, when Crays leaves, whether they are visible, what needs attention now, and then use People, Menu, or Feed.

Action and proof: signed room identity, connection truth, explicit Leave, fixed leave time, quiet/visible status, and the most urgent nonterminal trusted order establish the live state before the People/Menu/Feed projection. Quiet users get a direct Become visible sheet action; people open the message-request sheet.

Direction: inherit panel 5 of the approved One Night, One Home canvas. People leads by default. Room identity and Leave share one quiet header row; connection and leaving time share one compact status rail; People/Menu/Feed are underlined text navigation, never filled buttons. A yellow ready-order strip and the inline `Browsing quietly · Become visible` status set the tempo before a four-across portrait roster. Portraits show only names and open the in-screen message-request sheet directly—never a per-avatar ellipsis or pushed profile page. The roster ends with the Invite a friend link row. After leave or expiry, the exit treatment replaces the room inside Tonight while the footer stays fixed; Discover acknowledges that state in place and reveals Find without a redirect.

Constraints: every note, reply, reaction, and report stays scoped to the pinned room relay and session expiry; never imply global Nostr publication. Preserve NIP-10 root/reply markers, kind-7 reaction semantics, content-addressed Blossom metadata, large text wrapping, reduced-motion safety, attachment limits, and useful loading/empty/error/retry/disabled states. Do not mirror subscription buffers into a global store or create another manager.

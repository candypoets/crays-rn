# Messages and conversation

**Canonical contract:** [docs/screens/messages.md](../../../screens/messages.md)  
**Code:** `src/app/(tabs)/messages.tsx`, `src/app/conversation.tsx` → `src/screens/messages/MessagesScreens.tsx`  
**Mockup:** [commerce and messages board](../mockups/03-commerce-and-messages-v1.png), panels 05–06

## Night Playlist treatment

Messages are the durable echo after the live set. The list uses concise
conversation rows with a small current-room or last-room context; the thread
uses a quiet, keyboard-safe composer and never depends on room presence.

## Motion contract

- Tab selection changes content in place and preserves scroll/thread state.
- Opening a thread uses native stack motion; the header avatar/name remain stable.
- A newly sent message appends once with `tempo-fade`, not a scroll-jump or
  celebratory animation.
- Accept, Not now, Block, and Report update the request state only after the
  relevant relay result; keep failure copy next to the action.
- Returning from a thread restores the Messages list position.

Room expiry changes the context label, not the existence of the durable thread.

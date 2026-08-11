# Message request

**Canonical contract:** [docs/screens/22-message-request.md](../../../screens/22-message-request.md)  
**Code:** `src/app/message-request.tsx` → `src/screens/messages/MessageRequestScreen.tsx`  
**Mockup:** [commerce and messages board](../mockups/03-commerce-and-messages-v1.png), panel 05

## Night Playlist treatment

This is a one-message invitation, not a gamified social action. Show Maya’s
room context, one editable composer, recipient controls, and a calm “no
pressure” safety note.

## Motion contract

- Open with the profile context shared into the route; focus the composer only
  after the screen is mounted and the keyboard can remain safe.
- Character count and validation update in place with no layout jump.
- Send disables repeat taps and changes to a determinate “Sending request…”
  state. Success transitions to Conversation only after relay confirmation.
- Rejected/timeout retains the draft and explains retry; Back never discards it
  silently.

Rate limits, block, and report are visible text actions, not hidden animations.

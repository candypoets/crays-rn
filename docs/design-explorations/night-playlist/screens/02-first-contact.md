# First contact / person card

**Canonical contract:** [docs/screens/02-first-contact.md](../../../screens/02-first-contact.md)  
**Code:** `src/app/person.tsx` → `src/screens/room/FirstContactScreen.tsx`  
**Mockup:** [room and feed board](../mockups/01-room-and-feed-v1.png), panel 04

## Night Playlist treatment

Open Maya’s card as a native bottom sheet. The selected avatar, name, intent,
and one-line context form the top “liner note”; the actions are explicit:
**Message Maya** first, **Send a drink** second, **Browse quietly** as a
privacy option.

## Motion contract

- The invoking avatar/name remains visible while the sheet rises over 360 ms.
- The sheet settles once with a small spring; the action buttons do not pulse.
- Message pushes to Conversation or Message Request using the native route
  transition.
- Send a drink pushes to Gift Select with Maya’s pubkey carried in route state;
  the recipient never visually changes during selection.
- Dismiss reverses the sheet and restores focus to the person control.

The route must fail closed if the person is no longer valid. Block and Report
remain in the overflow action, never hidden behind decorative motion.

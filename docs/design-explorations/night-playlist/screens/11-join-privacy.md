# Join privacy

**Canonical contract:** [docs/screens/11-join-privacy.md](../../../screens/11-join-privacy.md)  
**Code:** `src/app/join-room.tsx` → `src/screens/discovery/JoinPrivacyScreen.tsx`  
**Mockup:** [discovery and access board](../mockups/05-discovery-and-access-v1.png), panel 04

## Night Playlist treatment

This is the final beat before the room begins. Present **Browse quietly** and
**Be visible** as equal, large choices. The wording explains that joining,
reading, ordering, and becoming visible are separate decisions.

## Motion contract

- The two choices settle side by side after the room preview route transition;
  no default selection is pre-highlighted.
- Selecting one gets a 120 ms role-color/focus response and updates the
  explanation in place.
- Confirming starts room entry and shows a single connection transition; it
  does not animate presence as if already published.
- A relay failure returns to the same choice with the draft preference intact.

The resulting active Room opens on People with a connected label. Visibility is
derived from the real publish result, not from the selected card animation.

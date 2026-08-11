# Invite accepted

**Canonical contract:** [docs/screens/08b-invite-accepted.md](../../../screens/08b-invite-accepted.md)  
**Code:** `src/app/invite-accepted.tsx` → `src/screens/onboarding/InviteAcceptedScreen.tsx`  
**Mockup:** [entry and account board](../mockups/02-entry-and-account-v1.png), panel 04 variant

## Night Playlist treatment

Show a settled “grant saved” moment with a clear next decision: Join room,
view membership, or enter later. The success is durable entitlement, not room
presence.

## Motion contract

- Confirm the saved grant with a single checkmark settle over `tempo-status`.
- Keep Join room as an explicit primary action; it pushes to Join Privacy.
- Membership opens its durable detail route. Enter later returns to the
  preserved context without starting a room subscription.
- If the grant cannot be confirmed, freeze the card and show retry/error copy.

The screen never says “you are in the room” until the separate join contract
completes.

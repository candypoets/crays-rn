# Invite preview

**Canonical contract:** [docs/screens/08-invite-preview.md](../../../screens/08-invite-preview.md)  
**Code:** `src/app/invite.tsx` → `src/screens/onboarding/InvitePreviewScreen.tsx`  
**Mockup:** [entry and account board](../mockups/02-entry-and-account-v1.png), panel 04

## Night Playlist treatment

An invite is a room waiting, not an automatic join. Show issuer, room, grant,
expiry, and the preserved next chapter in a compact event card. Keep **Keep
invite** and explicit account/entry actions separate.

## Motion contract

- Parse/verify state enters with a quiet loading rail; do not show a fake grant
  while verification is pending.
- Verified content fades into the invite card once. Invalid/expired content
  replaces it in place with a clear reason.
- Accepting stores/redeems only what the contract allows, then pushes to Invite
  Accepted; it does not publish presence.
- Back returns to the preserved previous context without losing the invite.

The event id, issuer, relay, and expiry are data, not decorative labels.

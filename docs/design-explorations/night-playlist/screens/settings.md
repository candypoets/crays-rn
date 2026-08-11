# Settings

**Canonical contract:** [docs/screens/settings.md](../../../screens/settings.md)  
**Code:** `src/app/settings.tsx` → `src/screens/settings/SettingsScreen.tsx`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 08

## Night Playlist treatment

Settings is the quiet backstage control room: grouped rows for profile, blocked
people, privacy/presence, safety, recovery, and room controls. Use standard
list geometry rather than extending the playful event canvas.

## Motion contract

- Rows enter as one stable list and keep native disclosure behavior.
- Toggling a preference changes its control over `tempo-press` and exposes the
  resulting text state; no color-only confirmation.
- Block/unblock and destructive controls use explicit confirmation sheets.
- Returning from a child route restores the group position and focus.

Settings never silently publishes, leaves, changes relays, or overwrites
identity. It only delegates those actions to their existing owners.

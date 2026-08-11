# Nearby / Bluetooth rationale

**Canonical contract:** [docs/screens/10b-bluetooth-rationale.md](../../../screens/10b-bluetooth-rationale.md)  
**Code:** `src/app/bluetooth-rationale.tsx` → `src/screens/discovery/BluetoothRationaleScreen.tsx`  
**Mockup:** [discovery and access board](../mockups/05-discovery-and-access-v1.png), panel 02

## Night Playlist treatment

Make the permission explanation feel like a clear pre-show note: why Nearby
helps, what it does not do, and the two honest alternatives. Use one static
Bluetooth symbol with a very slow optional ring; it must not look like scanning
has started before consent.

## Motion contract

- Enter with a 280 ms crossfade from Discover.
- Pressing Turn on Nearby changes the button to an explicit loading state while
  the OS permission request is active.
- Granted returns to Discover or the preserved join intent with a single route
  transition; denied/blocked returns to the rationale with actionable copy.
- Use Map / room link is immediate and has no permission animation.

The screen never claims to publish exact location or make the user visible.
Reduce Motion removes the ring entirely.

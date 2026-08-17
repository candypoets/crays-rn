# Screen 10B — Nearby Devices rationale

## Product contract

Canonical visual reference: `docs/design-explorations/night-playlist/mockups/05-discovery-and-access-v1.png`, panel 02. The Night Playlist signal diagram and pale cue-sheet layout supersede the incumbent dark rationale treatment.

Purpose: explain the concrete room-discovery benefit before the operating
system permission. The screen explicitly says Bluetooth finds participating rooms only, Crays does not publish presence or exact location, and the person still chooses entry and visibility. **Turn on Nearby** is the only place allowed to trigger the OS request; **Use Map / room link** must remain useful.

Three static concentric rings surround the Bluetooth symbol but never rotate or pulse before consent, so the illustration cannot be mistaken for an active scan. Back and the secondary action return to the preserved Discover context without requesting permission.

No Nostr connection, subscription, presence, location publication, notification
request, or camera request occurs on this screen. If the platform grants,
continue to verified room selection/join privacy. If it denies, preserve Map,
QR/link, Messages and Me and offer platform Settings only after denial.

## QA strategy

The component test verifies both privacy statements and both actions. Maestro
deep-links directly, asserts every boundary before any platform prompt and
captures the native layout. `scenario:10b-bluetooth-rationale` clears app
state/logcat and owns the screen flow; later platform-permission suites add
grant, deny, deny-permanently, Bluetooth-off and no-beacon paths without
changing this screen contract.

Pass criteria: no runtime permission appears before Continue, Map remains
reachable, all controls are at least 48dp, and large text does not hide either
action.

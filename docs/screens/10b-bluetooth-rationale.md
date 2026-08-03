# Screen 10B — Nearby Devices rationale

## Product contract

Purpose: explain the concrete room-discovery benefit before the operating
system permission. The screen explicitly says Nearby does not make the person
visible, publish exact location, or choose a room. **Continue** is the only
place allowed to trigger the OS request; **Use Map instead** must remain useful.

No Nostr connection, subscription, presence, location publication, notification
request, or camera request occurs on this screen. If the platform grants,
continue to verified room selection/join privacy. If it denies, preserve Map,
QR/link, Messages and Me and offer platform Settings only after denial.

## QA strategy

The component test verifies both privacy statements and both actions. Maestro
deep-links directly, asserts every boundary before any platform prompt and
captures the native layout. `.qa/qa-10b-bluetooth-rationale.mjs` clears app
state/logcat and owns the screen flow; later platform-permission suites add
grant, deny, deny-permanently, Bluetooth-off and no-beacon paths without
changing this screen contract.

Pass criteria: no runtime permission appears before Continue, Map remains
reachable, all controls are at least 48dp, and large text does not hide either
action.

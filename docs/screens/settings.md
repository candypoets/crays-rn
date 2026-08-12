# Profile, settings, and advanced recovery

## Product + implementation contract

Settings reports the custody state truthfully: the local private key is protected in device-only SecureStore, Apple/Google are not configured, and export/remote signer require focused custody design. Privacy defaults and notifications are explicit states rather than silent toggles. The screen lists persisted venue/global blocks and allows exact-scope unblock. “Other ways to log in” never imports, overwrites, merges, or exposes a key in this build.

States include local identity, invalid protected state, provider unlinked/linked, recovery unavailable, remote signer pending, notification denied, block list empty, and storage error. Durable purchase is forbidden until recovery consequence is acknowledged.

## Complete QA strategy

`.qa/qa-settings.mjs` uses a deterministic dev signer and asserts custody, provider, notification, and empty-block truth. `qa-safety-blocks.mjs` covers populated global/venue rows, relaunch, filtering, and unblock. `.qa/qa-account-recovery.mjs` proves the no-overwrite fallback. Existing entry QA verifies device-only key/profile signatures. Provider/import work is D-008; push delivery is D-009.

## Night Playlist implementation

Board 04 panel 08 becomes a quiet grouped control room with compact child-route chrome: Profile & access, Privacy & presence, exact-scope Blocked people, Notifications, and Recovery & room controls. Read-only or unavailable settings use stacked, large-text-safe status badges without disclosure chevrons, so they cannot masquerade as working routes or switches. Block-list hydration is a loading state, and a SecureStore read failure is an error state; **Nobody is blocked** appears only after a successful empty read. The only mutations here remain exact-scope Unblock actions: a native confirmation names the person and whether removal applies in this room or everywhere, then one removal locks all repeated submits until storage settles and announces its result. Conversation refresh failure after a successful global unblock is reported as a refresh warning, never as a false block-removal failure. Room and identity behavior stays with its existing owner. Every deferred provider, notification, recovery, and room-control state is named in text.

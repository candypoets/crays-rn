# Profile, settings, and advanced recovery

## Product + implementation contract

Settings reports the custody state truthfully: the local private key is protected in device-only SecureStore, Apple/Google are not configured, and export/remote signer require focused custody design. Privacy defaults and notifications are explicit states rather than silent toggles. The screen lists persisted venue/global blocks and allows exact-scope unblock. “Other ways to log in” never imports, overwrites, merges, or exposes a key in this build.

States include local identity, invalid protected state, provider unlinked/linked, recovery unavailable, remote signer pending, notification denied, block list empty, and storage error. Durable purchase is forbidden until recovery consequence is acknowledged.

## Complete QA strategy

`.qa/qa-settings.mjs` uses a deterministic dev signer and asserts custody, provider, notification, and empty-block truth. `qa-safety-blocks.mjs` covers populated global/venue rows, relaunch, filtering, and unblock. `.qa/qa-account-recovery.mjs` proves the no-overwrite fallback. Existing entry QA verifies device-only key/profile signatures. Provider/import work is D-008; push delivery is D-009.

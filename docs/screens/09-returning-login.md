# 09 — Returning login

## Product and implementation contract

Returning login prioritizes device unlock when a valid protected local identity exists. It reads—but does not consume—the persisted entry context and resumes the exact invite or safe Discover destination after the signer is configured. Apple and Google are visible as equal future access methods but disabled and labeled “Not configured”; this app does not fake provider authentication. “Other ways” leads to account recovery/import work without overwriting a local key.

States: protected identity present; no device identity; invite context present; no context; protected storage read failure; signer unavailable; unlock in progress; unlock cancelled/error; success; and provider unavailable. No identity merge or entitlement move occurs here.

## Complete QA strategy

`.qa/qa-09-returning-login.mjs` uses a test-relay fixture key only through the development-only seed route, opens login, proves local unlock, honest provider states, and the destination. Invite-resume coverage chains screen 08 → login → screen 08 without losing token/service/room values. Unit tests cover disabled providers, missing identity, local unlock callback, preserved-context copy, and recovery/create alternatives. Native QA must additionally background/relaunch at login and after unlock; the invite remains recoverable and the signer is reconfigured before any write. Release builds must not expose the seed route.

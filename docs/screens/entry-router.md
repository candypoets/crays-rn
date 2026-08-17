# Entry router

## Product requirement

The root route is a state resolver, not a home screen. It reads nipworker's persisted signer account plus Crays' signed local profile/completion projection before choosing the first meaningful destination. A person must never briefly see cold education and then jump to a later screen.

Resolution for this slice is deterministic:

| Signer and onboarding state | Destination |
| --- | --- |
| No identity | `/welcome` |
| Local identity, no signed profile | `/profile` |
| Signed profile, onboarding incomplete | `/recovery` |
| Identity + profile + completion | `/discover` |
| Identity + profile + completion + unexpired active room | `/room` |

Invite/deep-link context now takes precedence over these defaults. The `/invite` route validates the link and persists the context through `src/account/context.ts` before authentication; `/login` and `/recovery` resume the preserved invite after auth instead of following the default table. Behavior is specified in `docs/screens/08-invite-preview.md` and exercised by the `.qa/qa-08*` scenarios.

## Interaction and states

- Normal resolution shows a short branded loading state and replaces the route; it does not add `/` to the user's Back history.
- Signer-account or profile-storage failure stays on an explicit error state with **Try again**.
- Incomplete local work resumes at the first unfinished step after process death or relaunch.
- A valid active room resumes before Discover; an expired or malformed room never bypasses the normal destination.
- A corrupt "complete" flag without an identity never grants access and resolves to Welcome.

## Nostr and storage behavior

`src/app/_layout.tsx` initializes the one app-wide nipworker manager with empty relay arrays before the router resolves. The router treats a validated `manager.getAccounts()` private-key or NIP-46 record as the identity source and uses SecureStore only for the signed public kind-0 profile and completion marker. Crays never restores an identity from its former `crays.identity.nsec`, `.pubkey`, or `.signer` Keychain entries; those legacy copies are deleted. A true uninstall removes nipworker's app-container account storage, so legacy Keychain residue alone resolves to Welcome. An upgrade or ordinary relaunch retains the nipworker account and resumes the first unfinished onboarding step. Resolution creates no key, subscription, publish, or relay connection.

## QA strategy

`src/account/__tests__/state.test.ts` exhaustively pins the state table. `account.test.ts` proves signer-payload validation, normal resume, and the reinstall regression: a complete signed profile plus legacy Keychain credentials but no nipworker account resolves to Welcome. `src/app/__tests__/index.test.tsx` covers the static branded resolver, active-room replacement, explicit storage failure, and user-triggered retry. Screen QA flows start with cleared package state through `maestro/flows/launch.yaml`, proving the native nipworker account is absent and the root resolves to Screen 06 rather than relying on a direct test route.

`scenario:cold-signup` completes onboarding and then verifies the signed local profile and zero onboarding relay traffic. The screen-specific resume scenarios relaunch without clearing state and prove resolution to the first unfinished destination or Discover. Invite-priority and returning-login have their own relay-backed scenarios.

## Exit criteria

- No cold-screen flash for returning state.
- Retry is accessible and does not loop automatically.
- Root resolution opens no relay or OS permission.
- System Back is not trapped by a transient `/` route.

## Night Playlist implementation

The resolver remains visually quiet: one brand mark and a static Night Playlist tempo rail while protected state resolves. It has no spinner, animated splash, relay activity, or permission request. Only a read failure becomes an interactive surface, with an accessible alert and explicit 48dp **Try again** action.

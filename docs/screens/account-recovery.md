# Existing Nostr identity login

## Product and interaction contract

This route is the real existing-identity path. Crays has no username/password or Apple/Google account layer. It offers two Nostr custody choices in a deliberate order: **Connect a signer** by NIP-46 (recommended), then **Import a secret key** as an advanced device-custody fallback. Both paths establish the public key first and then replace this route with Profile so the user explicitly confirms the name rooms will see. Neither path joins a room, publishes presence, redeems an invite, or looks up a profile on an unrelated relay.

The route refuses to run when any Crays identity material already exists. It never overwrites, merges, or silently switches an account; account removal/switching needs its own authenticated Settings flow.

Visual authority remains Night Playlist entry/account board 02 panel 08, reframed as a two-device backstage handoff. The method list is one grouped surface, not equal promotional cards: signer custody carries the only **Recommended** badge, while secret import stays visually secondary.

## Entry, hierarchy, and navigation

- Entry: Cold welcome → **Log in** → **Use an existing Nostr identity**, or Account access → **I already have an account** → the same login route.
- Method state: **Use your Nostr identity**, the no-password explanation, signer and import rows, and the no-overwrite/custody note.
- Signer state: **Connect your signer**, QR request, **Open signer app**, live waiting status, and optional `bunker://` field. Back cancels the pending signer session and returns to methods; platform Back follows the same rule.
- Import state: **Import a secret key**, secure `nsec1…` field, explicit custody warning, and **Import and continue**. Back clears the input and returns to methods.
- Success: `/profile` (preserving the durable entry context); Profile is never skipped because a NIP-46 transport relay is not assumed to be a public profile directory.

## NIP-46 and storage behavior

- QR login creates an ephemeral client key and random challenge with the platform cryptographic RNG, builds `nostrconnect://<client-pubkey>?relay=…&secret=…&name=Crays&perms=…`, requests only the NIP-04 and exact event-kind permissions currently used by Crays, and passes the URL plus client secret to the one app-wide nipworker manager.
- Discovery relays come from comma-separated `EXPO_PUBLIC_CRAYS_NIP46_RELAYS`; the release fallback is `wss://relay.nsec.app`. A pasted bunker link uses only its declared `ws(s)` relay parameters.
- The screen listens for nipworker's narrowed `auth` result, requires a 64-character public key and `hasSigner=true`, and waits up to 120 seconds. Rejection, timeout, malformed response, or cancel removes listeners and locks the pending signer.
- Successful QR discovery must return a reusable `bunker://` session. Crays stores only `{type: nip46, url, clientSecret}` and the public key in device-only SecureStore; it never receives or stores the user's Nostr secret key. The profile/signing layer restores that signer on relaunch and opens a valid NIP-46 `auth_url` challenge when required.
- Advanced import accepts only a valid NIP-19 `nsec`, derives and confirms its public key through nipworker, then stores the nsec with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. The input is cleared immediately on submit and is never logged, echoed, or displayed again.
- nipworker remains the only signer/relay engine. No screen creates a manager, mirrors subscription buffers, or introduces an API backend.

## States and failures

- Method selection; QR preparing; QR ready/waiting; same-device signer app unavailable; bunker entry; signer rejected; timeout; cancellation; and successful remote connection.
- Secret empty; malformed/non-nsec; protected storage unavailable; native engine unavailable; signer/public-key mismatch; importing; and success.
- Existing or inconsistent stored account material is blocking. The recovery copy directs the user to remove the current identity from Settings when that authenticated workflow exists; no replacement key is generated.
- Background/keychain failures remain errors. They are never interpreted as an absent identity.

## Accessibility and responsive behavior

- Each state has one header. Method rows and every action expose button semantics and at least 48 dp targets.
- The QR container has an explicit ready/preparing label; the encoded secret is never read aloud as raw text. Waiting status is a polite live region and includes text, not color alone.
- Inputs retain visible labels or nearby instructions, disable autocorrect/capitalization, and remain reachable through the keyboard-adjusting scroll shell. Secret import uses secure text entry.
- At large type the grouped rows, status, inputs, and actions wrap vertically; the QR remains centered and does not force lateral scrolling.

## Complete QA strategy

- Pure logic: `nostrConnect.test.ts` verifies cryptographic request shape, relay validation/dedupe, bunker validation, and absence of nsec fields.
- Account logic: `identityAccess.test.ts` proves public-key confirmation before persistence, reusable NIP-46 descriptor storage without nsec, protected nsec import, and invalid-input rejection. `account.test.ts` verifies remote-signer account projection.
- Component: `AccountRecoveryScreen.test.tsx` covers hierarchy, recommended custody, QR/waiting state, same-device action, bunker input, cancellation, secure import, and absent provider UI.
- Device: `maestro/flows/account-recovery.yaml` enters from a clean install, exercises and cancels the NIP-46 waiting surface, imports a deterministic nsec, reaches Profile, and relaunches there.
- Scenario: `scenario:account-recovery` owns clean bootstrap/teardown; its independent verifier requires exactly one expected public identity with `imported-privkey` custody, zero early profile/completion markers, and no nsec in logcat.
- A release-candidate NIP-46 smoke run must additionally connect a real signer through the configured relay, approve a kind-0 signature, relaunch, restore the bunker session, and independently verify the signed event before release. UI-only QR assertions are not protocol-success proof.

# 06 — Cold welcome

## Product requirement

This is the first screen only for a clean launch with no preserved invite and no recognized identity. It communicates one promise, makes **Create account** the primary action, keeps **Log in** quiet but available, and reassures the person that opening Crays does not publish location or visibility.

Visual authority: the Night Playlist entry/account board `docs/design-explorations/night-playlist/mockups/02-entry-and-account-v1.png`, **panel 01**, with the treatment notes in `docs/design-explorations/night-playlist/screens/06-cold-welcome.md`. This supersedes the older `assets/screens/06-cold-welcome.png` reference.

## Content and hierarchy

1. Plum Crays mark (upper left) and the coral handwritten-style **Tonight moves.** cue (upper right, decorative; rendered as italic rotated text until a handwritten face ships).
2. **Your night starts here** — the centered display promise.
3. **Upcoming moments** — a compact vertical timeline of three illustrative white entries on a thin rail: Gallery Opening / The Mercer Loft at 8:00 PM (coral accent), Rooftop Jazz / The Skyline Room at 9:30 PM (lime accent), After Hours / Basement Sessions at 11:30 PM (yellow accent). Entries are static samples of the night's texture, never live venue data.
4. **Create account** — the one blue committed action.
5. **Log in** — quiet centered text action.
6. **No public location. You choose when you're visible.** — text reassurance.

The screen must not mention mints, relay URLs, keys, payment processors, or Bluetooth implementation details.

## Entry, exits, and navigation

- Entry: root router resolves an empty protected state to `/welcome`.
- Create account: pushes `/account-access` and preserves normal Back behavior.
- Log in: pushes `/login` (screen 09, implemented). It must not create a new identity, erase state, or imply Apple/Google access works; on a clean device the login screen reports that no account exists here.
- System Back from a cold root follows platform behavior; the screen does not intercept it.

## States and failures

- Default is immediately interactive after routing.
- No loading state is necessary because this screen performs no I/O.
- Long copy and large system text may scroll; the primary action must remain reachable.
- No permission sheet may be triggered from mount or either action.

## Accessibility

- The promise is the only header.
- Both actions expose button roles and minimum 48 dp targets.
- The mark and the Tonight moves cue are decorative; the cue stays real text so it scales with system type.
- The moments timeline follows the heading in reading order and reads as static sample text; it never announces live or verified venue status.
- Privacy reassurance is text, not only a location icon.

## Nostr and relay behavior

None. The app-wide nipworker runtime may be ready, but Screen 06 creates no signer, subscription, publish, or relay connection.

## QA strategy

- Component: `ColdWelcomeScreen.test.tsx` checks the promise, the Tonight moves cue, the three sample moments, CTA hierarchy, privacy copy, and both action callbacks.
- Device: `maestro/flows/06-cold-welcome.yaml` starts from cleared app data, proves entry routing, checks both CTAs, checks deferred login copy, captures the screen, and advances to 06B.
- Scenario: `.qa/qa-06-cold-welcome.mjs` performs bootstrap → Maestro exercise → package-specific teardown.
- Manual: Android/iOS large text, compact-height phone, dark/light OS setting, reduced motion, and screen-reader traversal.

## Exit criteria

- No permission dialog or relay activity.
- Create account reaches Screen 06B once.
- Repeated tapping cannot stack duplicate routes.
- Log in changes no account state.

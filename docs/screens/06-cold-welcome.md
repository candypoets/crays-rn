# 06 — Cold welcome

## Product requirement

This is the first screen only for a clean launch with no preserved invite and no recognized identity. It communicates one promise, makes **Create account** the primary action, keeps **Log in** quiet but available, and reassures the person that opening Crays does not publish location or visibility.

Canonical visual reference: `assets/screens/06-cold-welcome.png`.

## Content and hierarchy

1. Crays mark and product identity.
2. **Your night, in one place.**
3. A concise scope line covering the room, ordering, and durable items.
4. A coaster/ticket composition that establishes the night-out object language without presenting fictional live data as a connected room.
5. **Create account**.
6. **Log in**.
7. **No public location. You choose when you're visible.**

The screen must not mention mints, relay URLs, keys, payment processors, or Bluetooth implementation details.

## Entry, exits, and navigation

- Entry: root router resolves an empty protected state to `/welcome`.
- Create account: pushes `/account-access` and preserves normal Back behavior.
- Log in: currently shows an explicit deferred-state explanation. It must not create a new identity, erase state, or imply Apple/Google access works. Screen 09 will replace this deferred action.
- System Back from a cold root follows platform behavior; the screen does not intercept it.

## States and failures

- Default is immediately interactive after routing.
- No loading state is necessary because this screen performs no I/O.
- Long copy and large system text may scroll; the primary action must remain reachable.
- No permission sheet may be triggered from mount or either action.

## Accessibility

- The promise is the only header.
- Both actions expose button roles and minimum 48 dp targets.
- The decorative composition follows the heading in reading order and does not announce synthetic venue data as live status.
- Privacy reassurance is text, not only a location icon.

## Nostr and relay behavior

None. The app-wide nipworker runtime may be ready, but Screen 06 creates no signer, subscription, publish, or relay connection.

## QA strategy

- Component: `ColdWelcomeScreen.test.tsx` checks the promise, CTA hierarchy, privacy copy, and both action callbacks.
- Device: `maestro/flows/06-cold-welcome.yaml` starts from cleared app data, proves entry routing, checks both CTAs, checks deferred login copy, captures the screen, and advances to 06B.
- Scenario: `.qa/qa-06-cold-welcome.mjs` performs bootstrap → Maestro exercise → package-specific teardown.
- Manual: Android/iOS large text, compact-height phone, dark/light OS setting, reduced motion, and screen-reader traversal.

## Exit criteria

- No permission dialog or relay activity.
- Create account reaches Screen 06B once.
- Repeated tapping cannot stack duplicate routes.
- Log in changes no account state.

# 07 — Minimal account setup

## Product requirement

Ask only for the name people should see. Photo, bio, intent, and room-specific context remain optional until useful. Continuing signs a real Nostr kind-0 profile with the already-established local key or connected signer.

Visual authority: the Night Playlist entry/account board `docs/design-explorations/night-playlist/mockups/02-entry-and-account-v1.png`, **panel 03**, with the treatment notes in `docs/design-explorations/night-playlist/screens/07-account-setup.md`. This supersedes the older `assets/screens/07-account-setup.png` reference.

## Content and hierarchy

- Back (upper left), decorative three-dot step indicator (first dot active, announced as a step label), and the plum Crays mark (upper right).
- **How should the room call you?** — the single prompt.
- **Display name** field: persistent small-caps label above a white field, live character count (`n/50`) inside the field's trailing edge, placeholder `Alex`.
- **What brings you out tonight? (optional)** — bright intent chips (Music, Art, Dance, Talks, Food, Vibes). Chips are local, reversible visual preferences in the current route: no persistence contract exists yet, nothing is published or saved, and selection never changes the submitted payload or makes visibility automatic.
- Lock note: **You decide what to share in each room. You can be quiet, browse, or be visible.** — room sharing and visibility are chosen later, per room.
- One blue **Continue**.

## Data contract

- Display name is trimmed, repeated whitespace is collapsed, and length after trimming must be 2–50 characters.
- The signed kind-0 content is JSON with both `name` and `display_name` set to the normalized value for compatibility.
- The event uses no tags in this slice and a current Unix timestamp.
- The signed event pubkey must equal the protected draft pubkey and `verifyEvent` must pass before storage.
- The signed event is stored locally for later publication to a justified identity or venue relay; this screen does not choose an arbitrary public backend.

## Interaction

- Back returns to Account access without deleting the protected draft key.
- Continue is disabled for invalid input and while signing.
- Intent chips toggle border/fill on press; selecting an intent never navigates or submits.
- Return/keyboard behavior must not hide the field or primary action permanently.
- Successful signing replaces Profile with Recovery; Recovery explicitly routes Back to Profile without deleting the signed draft.

## States and failures

- Empty and valid input.
- Too short and maximum-length input.
- Signing in progress with repeat taps disabled.
- Missing native runtime, signing timeout, invalid signature, and storage failure all remain on-screen with explicit copy and retry.
- Relaunch before signing returns here. Relaunch after a valid signed profile returns to Recovery.

## Accessibility

- The prompt is the header; the step dots expose an `Account step 1 of 3` label and are otherwise decorative.
- The field has a persistent visible and accessible label independent of placeholder text, plus a live character count.
- Intent chips expose button role and selected state; they are supplementary to the name question.
- No avatar, photo, or camera permission is requested on this screen.
- Validation and signing failures are announced through the error live region.

## Nostr and relay behavior

For local custody, the durable `nsec` stays in SecureStore and only its decoded hex scalar reaches nipworker's React Native signer boundary. For NIP-46 custody, Crays restores the saved bunker session and the external signer handles the approval; an `auth_url` challenge opens only when it is a valid HTTPS URL. Both modes sign through the one shared manager, allow up to 90 seconds for human approval, require the returned event pubkey to match the saved identity, and independently verify the signature before storage. No profile publish or data subscription occurs here.

## QA strategy

- Pure logic: `state.test.ts` checks normalization.
- Component: `ProfileSetupScreen.test.tsx` checks disabled/valid transitions,
  whitespace normalization at the signing boundary, exact submitted value,
  visible signature failure, character count, chip toggle/locality, and the
  lock note.
- Device: `maestro/flows/07-account-setup.yaml` creates a local identity, types and submits a realistic name, captures the screen, then relaunches and proves routing resumes at Recovery.
- Scenario: `.qa/qa-07-account-setup.mjs` independently requires exactly one valid signed profile, zero relay/subscription activity, and no completion marker before teardown.

## Exit criteria

- Valid input produces one verifiable kind-0.
- Invalid or repeated taps produce no signed event.
- Intent selection produces no persisted or published state.
- No private key is logged.
- Relay and subscription counts remain zero.

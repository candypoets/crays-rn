# Screen 11 — Room preview and privacy sheet

## Entry and presentation

Selecting a verified Tonight venue presents `/join-room` as a native form sheet with a grabber. The first block repeats the signed room name/about and venue preview and explicitly says the person is not inside. Back/dismiss returns to Tonight without mutation. The legacy `/room-preview` URL redirects into this same sheet so preview and privacy cannot diverge.

## States and interaction

Quiet is selected by default. It states that no presence event is published and that visible people cannot see the visitor. Visible entry expands intent, optional 80-character context, and access requirements. One-, two-, and four-hour automatic leave choices remain available. The primary coral action is **Enter room**; its pending state disables repeat submission while preserving choices. Definition loading, trust failure, invite failure, publish rejection, timeout, protected-storage failure, and retry remain in the sheet.

An already-quiet active session opens the same sheet in visibility-update mode from **Become visible**. Only Visible is offered; a successful update preserves `joinedAt`, changes the bounded presence fields, and starts the selected leave duration at the visibility commitment. The kind-10312 expiry and protected session `leaveAt` use the same whole-second boundary so relay visibility cannot outlive the local session.

## Protocol contract

Quiet saves one protected `ActiveRoom` and performs no kind-0 or kind-10312 publish. Visible validates any invite through the pinned NIP-97 chain, publishes the local kind-0 profile and exact room-addressed kind-10312 presence, and persists visible state only after required relay `OK`. Any intended relay accepting is success. Handles stop on success, rejection, timeout, retry, or unmount. Context is trimmed/bounded; expiry matches the selected leave boundary. Rejection never produces false People presence.

## Accessibility and QA

The sheet has a clear heading, textual privacy consequences, radio roles/states, 48dp targets, announced errors, and scroll/keyboard support. Unit tests cover preview, quiet default, visible expansion, bounded context, leave time, loading/error/disabled states, and exact preference projection. Existing quiet/visible relay journeys independently prove zero kind-10312 writes for quiet and valid signed profile/presence for visible.

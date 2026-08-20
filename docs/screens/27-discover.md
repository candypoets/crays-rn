# Screen 27 — Tonight / Find

## Entry and purpose

Tonight is the single home for the current night. It enters through completed onboarding, `/room`, a compatible `/discover` URL, a signed room link, QR handoff, or Nearby pointer. With no active session it shows **Find your room**; it never implies that the person has joined.

## Ready and interaction states

One root-authorized kind-30312 descriptor is presented as the featured photographic venue card with its signed name/about and textual **Verified room** proof. Pressing it opens the native room-entry sheet. **Scan QR**, **Map**, and **Nearby** are separate physical entry actions. Scan opens a dedicated scanner explanation before requesting camera permission; a valid venue pointer converges on the same entry sheet. Map opens the platform map search, preferring the already-verified room name when present; map results are navigation aids and are never labelled verified inside Crays. Choosing Nearby opens its rationale before any Bluetooth permission. Loading says the signature is being verified. Empty explains how to obtain a venue link. Forged/stale/timeout errors are announced and never leave a verified card behind. The development Test Room may be the featured result only in the existing test-build contract.

## Trust, relay, and privacy

The supplied relay is pinned. Its NIP-11 pubkey establishes the community root; the latest root-signed kind-31727 anchor establishes admins; only a root/admin-authored exact kind-30312 definition becomes a `RoomDescriptor`. QR, Nearby, direct-link, and test pointers converge on that same trust resolver; neither an encoded pointer nor an external map result supplies display identity. Find publishes no profile, presence, order, or selection mutation and asks for no permission on mount. Stable subscription IDs and exact relay scope prevent result replacement.

## Navigation and accessibility

The whole venue card is one labelled 48dp-plus action. Verification is text plus icon. Entry methods expose labelled 48dp-plus buttons; copy wraps at large type. Opening entry preserves exact relay, room, service, invite, and token parameters. Back from the entry sheet or scanner returns to unchanged Find state. Scanner states are checking, pre-permission prompt, denied/retry, granted, invalid-code retry, and valid handoff. No camera view mounts before permission; no photo is saved or uploaded; duplicate barcode callbacks are ignored after a valid handoff.

## QA

The component matrix covers loading, empty, error, disabled and enabled entry actions, verified room selection, Test Room selection, every scanner permission state, invalid QR input, and URL/JSON/base64 pointer parsing. The registered Discover handoff journey proves the scanner rationale appears before the native camera prompt. Discover/Test Room journeys continue to verify the independent NIP-11 → 31727 → 30312 chain and prove no entry/presence mutation before the sheet’s explicit action.

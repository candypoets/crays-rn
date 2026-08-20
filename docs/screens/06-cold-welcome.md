# Screen 06 — Cold welcome

The first of two identity-creation screens opens only when no complete local account exists. It presents **Your night starts here**, three compact product truths, primary **Create my Crays ID**, and secondary **Use an existing Nostr ID**. Create routes directly to profile setup; existing ID routes to login/import. Neither action creates identity until the explicit next action, contacts a relay, requests OS permission, or enters a room.

The layout supports large text and screen readers: the promise is a header, both actions are 48dp-plus labelled buttons, and color is supplementary. Unit tests cover copy, absence of fabricated events, and both callbacks. Entry-router/device coverage owns protected-state failures and native signer continuity.

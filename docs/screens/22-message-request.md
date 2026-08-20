# Screen 22 — Message request sheet

Selecting a visible person from Tonight opens a native form sheet, not a profile detour. The sheet shows portrait, name, intent, and exact room name; one editable 240-character note; optional starters; the one-request consent boundary; and coral **Send request**. Empty/whitespace is disabled. Sending preserves draft/count and locks repeat action. Relay rejection/timeout is announced with retryable draft intact. Dismiss/Not right now publishes nothing.

After the first intended relay returns `OK`, the protected local projection is saved and the composer becomes **Waiting for {name}** with **View in Messages**. Another request remains impossible until acceptance/reply. The kind-4 template contains only standard recipient tagging outside NIP-04 ciphertext; the encrypted envelope owns room id/name, stable message id, type, and text. Publish handles stop on settlement or unmount.

Unit tests cover empty, starter, edited, maximum, pending, error, success, room context, Messages navigation, and both dismiss paths. The registered relay journey independently verifies signature, ciphertext, decrypted payload, room context, and single-request behavior.

# 24 — Payment methods

## Product contract

Wallet, Apple Pay, Google Pay, and Card appear as peer choices when configured. The app defaults only to the person's last explicitly successful available method. Selecting a row changes review state; it never initiates payment.

The current pilot labels Wallet as setup required and provider-backed methods as not connected. No provider logos or availability are allowed to imply configuration. Returning preserves the originating self-order or gift-review context.

Visual authority: the Night Playlist commerce/messages board `docs/design-explorations/night-playlist/mockups/03-commerce-and-messages-v1.png`, **panel 04**, with the treatment notes in `docs/design-explorations/night-playlist/screens/24-payment-methods.md`. Night Playlist supersedes the older dark styling.

## Content and hierarchy

- App shell header: plum mark, Checkout eyebrow, **Payment methods** title, tempo rail; **Review** return link preserves the originating checkout context.
- Explainer: choose how you would pay when the venue enables that rail — selection does not initiate a charge.
- One grouped list of the four peer rails. Every row states its true configuration status (Wallet: setup required; Apple Pay / Google Pay: not connected in this pilot; Card: processor not connected). The selected row gets the single radio-selected role; no row implies balance, capability, or success.
- Footer truth: **No payment details are collected or shared in this build.**

## Accessibility

- Rows expose radio role and selected state; selection is also written by the on/off radio glyph, never color alone.
- Configuration status is per-row text; all rows keep 48 dp targets and the list scrolls at large text sizes.

## Paths and QA

No methods, one method, all methods, unavailable remembered method, wallet hidden balance, insufficient wallet, provider unsupported on platform, selection, cancellation/back, gift return, self-order return, relaunch. Unit coverage verifies all equal options, the selected radio state, and the no-charge honesty copy. `maestro/flows/24-payment-methods.yaml` opens from a real relay-backed cart, selects Wallet, and returns to review. `.qa/qa-24-payment-methods.mjs` owns source relay setup/verification/teardown. Provider and mint integrations require separate sandbox contracts before any method becomes payable.

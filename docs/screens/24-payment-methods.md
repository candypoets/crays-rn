# 24 — Payment methods

## Product contract

Wallet, Apple Pay, Google Pay, and Card appear as peer choices when configured. The app defaults only to the person's last explicitly successful available method. Selecting a row changes review state; it never initiates payment.

The current pilot labels Wallet as setup required and provider-backed methods as not connected. No provider logos or availability are allowed to imply configuration. Returning preserves the originating self-order or gift-review context.

## Paths and QA

No methods, one method, all methods, unavailable remembered method, wallet hidden balance, insufficient wallet, provider unsupported on platform, selection, cancellation/back, gift return, self-order return, relaunch. Unit coverage verifies all equal options and selection. `maestro/flows/24-payment-methods.yaml` opens from a real relay-backed cart, selects Wallet, and returns to review. `.qa/qa-24-payment-methods.mjs` owns source relay setup/verification/teardown. Provider and mint integrations require separate sandbox contracts before any method becomes payable.

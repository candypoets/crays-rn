# 26 — Add funds

## Product + implementation contract

This surface documents the future Lightning funding sequence but cannot create an invoice until a trusted Cashu mint and recoverable wallet are configured. The disabled state explains amount, live quote/expiry, mint proof verification, and safe sync. It avoids investment language and never displays a fake QR or invoice.

Future states: amount input/validation, quote loading, invoice ready, copied, paid pending mint, credited, expired, cancelled, Lightning failure, mint timeout/reconciliation, app closure, duplicate payment, token receive, and recovery conflict.

## Complete QA strategy

`.qa/qa-26-add-funds.mjs` reaches the screen from Wallet and asserts disabled/no-fabrication behavior while an isolated relay proves normal app context. Unit coverage requires the disabled commitment. Enabling requires a real disposable mint/Lightning test harness, exact quote IDs, expiry clock control, proof signature/value verification, encrypted relay backup, independent balance accounting, duplicate/relaunch and paid-but-mint-timeout recovery, and exact teardown.

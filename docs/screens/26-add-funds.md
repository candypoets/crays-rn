# 26 — Add funds

## Product + implementation contract

This surface documents the future Lightning funding sequence but cannot create an invoice until a trusted Cashu mint and recoverable wallet are configured. The disabled state explains amount, live quote/expiry, mint proof verification, and safe sync. It avoids investment language and never displays a fake QR or invoice.

Future states: amount input/validation, quote loading, invoice ready, copied, paid pending mint, credited, expired, cancelled, Lightning failure, mint timeout/reconciliation, app closure, duplicate payment, token receive, and recovery conflict.

## Complete QA strategy

`scenario:26-add-funds` reaches the screen from Wallet and asserts disabled/no-fabrication behavior while an isolated relay proves normal app context. Its independent negative verifier settles for relay lag before proving no NIP-60 wallet-configuration, proof, or spending-history event was written. Unit coverage requires the disabled commitment. Enabling requires a real disposable mint/Lightning test harness, exact quote IDs, expiry clock control, proof signature/value verification, encrypted relay backup, independent balance accounting, duplicate/relaunch and paid-but-mint-timeout recovery, and exact teardown.

## Night Playlist implementation

The bright setup explainer shares board 04’s Wallet language, compact child-route chrome, and tempo rail. It replaces the historical amount picker with one explicit unavailable card, the three required future steps, and a disabled commitment control. This state cannot display an amount, invoice, QR, Cashu token, expiry, or success animation because none exists. Back is a 48dp route to the unchanged Wallet frame.

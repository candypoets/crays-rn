# 25 — Wallet

## Product + implementation contract

Wallet is a quiet row under Me, not a primary tab. The current implementation intentionally renders `Unavailable`: no trusted mint, spendable proof set, NIP-60 encrypted state, quote, or sync/recovery contract is configured. It never fabricates a zero balance (which would imply a valid wallet), creates proofs, contacts a mint, or defaults checkout to Wallet. Advanced copy names Cashu/Nostr only where trust and recovery matter.

Future states must include visible/hidden balance, setup, incoming/outgoing pending, mint unavailable, sync conflict, quarantined proofs, recovery, insufficient funds, and activity. Fiat leads; sats are secondary. Verified local spend state wins over duplicate relay data.

## Complete QA strategy

`scenario:25-wallet` enters from Me with real room/account context and asserts unavailable/setup/sync language. Its independent negative verifier settles for relay lag before proving the app identity authored no NIP-60 wallet-configuration, proof, or spending-history events. Unit tests prohibit fabricated balance. Before enabling funding, add a disposable real mint harness with exact proof accounting, encrypted NIP-60 relay fixtures, conflict/duplicate/relaunch cases, backup recovery on a second isolated device, balance privacy checks, and one-spend-only verification.

## Night Playlist implementation

Board 04 panel 06 is adapted to the product’s current truthful state with compact child-route chrome: the balance block reads **Unavailable** rather than presenting a valid-looking zero, while Add funds opens only the configuration explainer. Receive and Activity are real, disabled, accessible 48dp controls whose visible **After wallet setup** copy matches their accessibility state. Recovery and Nostr sync are stated below the action row; no fiat, sats, proofs, transaction history, or recovery claim is synthesized.

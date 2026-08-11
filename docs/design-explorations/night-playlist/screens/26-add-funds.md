# Add funds

**Canonical contract:** [docs/screens/26-add-funds.md](../../../screens/26-add-funds.md)  
**Code:** `src/app/add-funds.tsx` → `AddFundsScreen`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 06

## Night Playlist treatment

Add funds explains the next real steps: amount, live Lightning quote/expiry,
and verified mint proofs. If configuration is absent, the screen is honest and
quiet instead of presenting a fake amount field.

## Motion contract

- Amount/quote steps advance only after the current step is valid; use a short
  shared-axis transition, not a carousel autoplay.
- Quote expiry updates text in place and disables the commitment action.
- Success changes the Wallet balance only after proofs verify and sync safely.
- Timeout/error preserves the amount/draft and offers retry.

No animated balance or payment success may precede mint/relay confirmation.

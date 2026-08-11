# Wallet

**Canonical contract:** [docs/screens/25-wallet.md](../../../screens/25-wallet.md)  
**Code:** `src/app/wallet.tsx` → `WalletScreen`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 06

## Night Playlist treatment

Wallet is discreet backstage utility: fiat-first balance state, Add funds,
Receive, Activity, and Recovery. It must not look like a trading screen or
compete with the room’s social tempo.

## Motion contract

- The balance/status block settles once on entry; no animated ticker or fake
  counting-up balance.
- Add funds/Receive/Activity push to their routes or show explicit unavailable
  sheets; Back returns to the same Wallet frame.
- A verified balance update crossfades the number once. Missing mint/configuration
  remains a stable unavailable state.
- Recovery changes use a standard confirmation route, not a playful spring.

Wallet state is private and never appears in room presence, profiles, or feed.

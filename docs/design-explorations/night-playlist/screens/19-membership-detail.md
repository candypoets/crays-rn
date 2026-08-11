# Membership detail

**Canonical contract:** [docs/screens/19-membership-detail.md](../../../screens/19-membership-detail.md)  
**Code:** `src/app/membership-detail.tsx` → `MembershipDetailScreen`  
**Mockup:** [durable and settings board](../mockups/04-durable-and-settings-v1.png), panel 05

## Night Playlist treatment

Detail shows status first, then available benefits, activity, renewal, and
management. The selected room and issuer context stay visible without putting
protocol vocabulary in the primary hierarchy.

## Motion contract

- Status enters as a settled state; no “activation” animation without a trusted
  award/status.
- A benefit use updates its own ledger row with `tempo-status`.
- Renewal/cancel management opens a normal confirmation sheet with explicit
  Back/Cancel; destructive state uses standard geometry.
- Missing/revoked status crossfades the body into the reason while retaining the
  durable record.

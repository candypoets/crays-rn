# Order detail

**Canonical contract:** [docs/screens/15-order-detail.md](../../../screens/15-order-detail.md)  
**Code:** `src/app/order.tsx` → `src/screens/durable/NightAndOrderScreens.tsx`  
**Mockup:** [commerce and messages board](../mockups/03-commerce-and-messages-v1.png), panel 08

## Night Playlist treatment

Order detail is the live backstage status: recipient/purchaser context, item,
venue, current status rail, receipt, and support. Use Accepted, Preparing,
Ready, Served, Cancelled, Refund pending, or Refunded—never Delivered.

## Motion contract

- The confirmed order enters with the current status already selected; do not
  play a fake progress sequence from zero.
- A real status update advances one rail node over `tempo-status` and crossfades
  the textual status. It cannot skip backwards because relay arrival order was
  different.
- Support/cancel/refund opens a normal child flow; the rail remains visible.
- Back returns to My Night or Orders without losing the selected durable record.

The order reference stays internal. Independent relay verification is required
for QA; UI animation is never protocol proof.

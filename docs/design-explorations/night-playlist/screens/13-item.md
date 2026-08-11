# Item detail

**Canonical contract:** [docs/screens/13-item.md](../../../screens/13-item.md)  
**Code:** `src/app/item.tsx` → `src/screens/commerce/ItemScreen.tsx`  
**Mockup:** [commerce and messages board](../mockups/03-commerce-and-messages-v1.png), panel 02

## Night Playlist treatment

Give one item a hero moment: drink/food image, name, modifiers, quantity, and
the exact price. The action says **Add to order · €12** and stays attached to
the item as the user edits it.

## Motion contract

- Product image shares from Menu into the hero over `tempo-route`.
- Modifier selection updates only the relevant row and price over `tempo-press`.
- Quantity changes use a 120 ms number crossfade; no bouncing counters.
- Add returns to Menu with a short cart cue after local cart mutation succeeds.
- Unavailable/stale item state replaces the action and preserves Back.

Cart state remains owned by `CartProvider`; animation cannot create a duplicate
line item or imply venue acceptance.

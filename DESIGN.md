---
name: Crays Night Playlist
description: A bright, tactile live set for a night in a verified real-world room.
colors:
  signal-blue: "#063BFA"
  signal-blue-pressed: "#061FD0"
  commitment-coral: "#FC5D4E"
  verified-lime: "#D7F53B"
  attention-yellow: "#FFD83D"
  canvas-lilac: "#F5F2FB"
  surface-white: "#FFFFFF"
  surface-lilac: "#E9DCF1"
  edge-lilac: "#D7D0EC"
  ink-plum: "#170A4C"
  ink-muted: "#665884"
  photo-night: "#0C0429"
  success: "#4A9243"
  error: "#C42636"
typography:
  display:
    fontFamily: "System"
    fontSize: "40"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-1.1"
  headline:
    fontFamily: "System"
    fontSize: "30"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.5"
  title:
    fontFamily: "System"
    fontSize: "20"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "System"
    fontSize: "16"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "System"
    fontSize: "12"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.8"
rounded:
  control: "14px"
  card: "16px"
  action: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    pressedColor: "{colors.signal-blue-pressed}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.action}"
    padding: "16px 20px"
    height: "56px"
  button-commitment:
    backgroundColor: "{colors.commitment-coral}"
    textColor: "{colors.ink-plum}"
    rounded: "{rounded.action}"
    padding: "16px 20px"
    height: "56px"
  card:
    backgroundColor: "{colors.surface-white}"
    borderColor: "{colors.edge-lilac}"
    textColor: "{colors.ink-plum}"
    rounded: "{rounded.card}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface-white}"
    borderColor: "{colors.edge-lilac}"
    textColor: "{colors.ink-plum}"
    rounded: "{rounded.control}"
    padding: "16px"
---

# Design System: Crays Night Playlist

## Overview

**Creative North Star: “Night Playlist”**

Crays is the live set of one verified room: discover it, choose how to enter, meet who is there, act on the night, then keep the durable pieces. It is not an infinite feed and not a generic dashboard. The interface should feel like a bright printed set list caught under venue light—pale lilac and warm white, deep-plum type, electric-blue actions, and clipped color tabs that keep a visible tempo.

The app is designed for short, distracted sessions in dim rooms. Hierarchy is immediate, copy is direct, touch targets are generous, and protocol truth remains visible without becoming the headline.

## Palette and signal roles

- **Canvas Lilac** (`#F5F2FB`) is the default screen field.
- **Surface White** (`#FFFFFF`) and **Surface Lilac** (`#E9DCF1`) separate content without turning every region into a floating card.
- **Ink Plum** (`#170A4C`) is the default text and icon color; **Ink Muted** (`#665884`) supports it at AA contrast on both white and Surface Lilac.
- **Signal Blue** (`#063BFA`) is navigation, selection, links, and the one primary action.
- **Commitment Coral** (`#FC5D4E`) marks consequential social or commerce commitments such as sending, paying, leaving, or gifting.
- **Verified Lime** (`#D7F53B`) means verified, admitted, complete, or currently valid.
- **Attention Yellow** (`#FFD83D`) flags information that needs a decision but is not an error.
- **Photo Night** (`#0C0429`) is reserved for full-bleed venue imagery, QR ink, and deliberate high-contrast moments.

Never use blue, coral, lime, and yellow as interchangeable decoration. Their meaning must remain stable across every screen.

## Typography

System sans remains the production typeface until a cross-platform brand font is packaged. The voice comes from scale, weight, tight display composition, and short lines—not excessive tracking or all-caps.

- **Display:** 36–42 sp, extra-bold, compact leading; one dominant message per screen.
- **Headline:** 28–32 sp, extra-bold; screen and major section titles.
- **Title:** 18–22 sp, bold; people, products, tickets, and durable objects.
- **Body:** 16–17 sp with open line height; explanations and states.
- **Label:** 11–13 sp, bold; stage, status, price, and metadata. Uppercase is limited to short functional labels.

Support system text scaling. Important copy must reflow rather than truncate, and controls must grow vertically when needed.

## Layout and tempo

- Keep a 20–24 dp compact-width gutter and a readable 620 dp maximum content width.
- Use the 4 / 8 / 12 / 16 / 24 / 32 spacing rhythm.
- Preserve a 48 dp minimum touch target; primary actions are at least 56 dp.
- Let major content sit directly on the canvas. Cards group a real object or decision, not every paragraph.
- Use thin tempo rails, clipped side tabs, sticker-like imagery, and occasional full-bleed venue moments to carry the visual identity.
- Primary actions follow the decision content and remain reachable with the keyboard open. They do not obscure content.

## Shape and depth

Controls and cards use 14–16 dp corners. Pills are reserved for compact tags, filters, statuses, and truly pill-shaped actions. Depth is mostly color and border; use a restrained plum shadow only where a ticket, portrait, or menu object should feel physically lifted. Avoid generic glass, glow, and decorative orb effects.

## Core components

### Actions

- The primary button is solid Signal Blue with white text and an explicit verb.
- A Commitment Coral action is used only when the next tap creates a meaningful social, financial, or privacy consequence.
- Secondary actions are text or outlined controls with the same 48 dp target.
- Loading disables repeat taps and preserves the control’s dimensions. Errors stay near the failed action and are announced.

### Cards and rows

- White cards use a one-pixel Edge Lilac border and 16 dp corners.
- Surface Lilac is the quieter grouped state; it must not compete with the primary action.
- Selected rows use a blue border or rail. Verified rows use a small lime field with a text/icon explanation, never color alone.
- Photos are cropped intentionally and include dark overlays only when light text is placed over them.

### Inputs

- Inputs use persistent labels, white fill, Edge Lilac border, and Ink Plum text.
- Focus and selection use Signal Blue. Placeholder text uses Ink Muted at accessible contrast.
- Validation states explain the correction in text and remain visible to screen readers.

### Navigation

The native stack and four-destination tab structure remain. System Back and predictive Back semantics take precedence. The tab bar is a white surface over the lilac canvas with blue active and muted-plum inactive states. Full-bleed photo screens may temporarily use light status-bar content; other screens use dark status-bar content.

## Motion

- press response: 120 ms;
- small fade/state swap: 180 ms;
- route transition: 280 ms;
- sheet transition: 360 ms;
- featured moment: 520 ms maximum;
- protocol-gated status confirmation: 420 ms maximum after truth is known.

Motion may explain hierarchy and state change, but it never fabricates relay success or delays a true state. Respect reduced motion by removing spatial travel and retaining short opacity changes only.

## Canonical product sequence

The system must tell one coherent story:

1. discover a verified room;
2. preview it before permissions or visibility;
3. enter quietly or visibly;
4. use People and Feed as the room’s live set;
5. message, order, gift, or RSVP from that context;
6. retain messages, orders, tickets, passes, memberships, and wallet state in My Night and Me;
7. end or switch rooms without implying durable objects were deleted.

## Accessibility and failure floor

- Meet WCAG AA contrast, 48 dp targets, logical focus order, screen-reader labels, dynamic type, and reduced-motion behavior.
- Do not encode verification, selection, availability, or danger by color alone.
- Show loading, empty, offline, retry, interrupted, disabled, and relay-unavailable states explicitly.
- Permission rationale precedes the platform prompt. Exact location is never implied or published.
- A publish becomes successful when any required relay returns true; the UI must not wait for every relay.
- Nostr engine, relay, coordinator, identity, entitlement, and payment limitations are stated accurately without inventing success.

## Do / don’t

**Do** match the approved mockups’ composition, color roles, clipped tabs, imagery, and operational clarity. Reuse semantic tokens and shared primitives. Keep test identifiers and product truth intact.

**Don’t** fall back to the incumbent dark wine theme, scatter brand hex values through screens, make every section a rounded container, use generic gradient/orb decoration, introduce provider or payment claims, or let a visually polished state overrule relay truth.

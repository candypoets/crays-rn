---
name: Crays Mobile
description: The tactile operating system for a night in a real room.
colors:
  primary: "#f50a48"
  accent: "#ff7668"
  night: "#10090e"
  night-raised: "#1a1017"
  night-border: "#281620"
  paper: "#fff4f5"
  muted: "#c9aeb6"
  success: "#61bd91"
  error: "#e5484d"
typography:
  display:
    fontFamily: "System"
    fontSize: "48"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-1.2"
  body:
    fontFamily: "System"
    fontSize: "17"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "System"
    fontSize: "13"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "1.8"
rounded:
  control: "16px"
  action: "999px"
  artifact: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.action}"
    padding: "16px 24px"
    height: "56px"
  input:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "16px"
---

# Design System: Crays Mobile

## Overview

**Creative North Star: "The Night's Paper Trail"**

Crays should feel like the physical objects exchanged during a night out: a coaster, receipt, wristband, stamp, menu, and ticket. The interface is dark enough for a room at night, while pale paper artifacts hold explanations and credentials. It is expressive at entry and acquisition moments, then operational and predictable during tasks.

**Key Characteristics:**

- near-black wine surfaces with warm-white text;
- coral-to-hot-pink brand energy reserved for decisive actions;
- tactile paper and woven artifacts used when they communicate meaning;
- large Swiss-style headlines, short copy, and familiar native controls;
- venue language in the foreground and protocol details in advanced states.

## Colors

The palette uses wine-black tonal layers, warm paper, and one vivid coral-red action voice.

### Primary

- **Crays Signal** (`#f50a48`): primary actions, active destinations, and critical brand marks.
- **Last Light** (`#ff7668`): the warm end of action gradients and restrained highlights.

### Neutral

- **Night** (`#10090e`): default screen background.
- **Raised Night** (`#1a1017`): fields, choice rows, and navigation surfaces.
- **Wine Edge** (`#281620`): structural borders and dividers.
- **Ticket Paper** (`#fff4f5`): primary text and tactile paper surfaces.
- **Dusty Rose** (`#c9aeb6`): secondary copy.

**The One Signal Rule.** The primary gradient identifies the one committed action on a screen; secondary actions remain text or outlined controls.

## Typography

System sans typography is used until the production Crays font is packaged for both platforms. Heavy, tightly composed display copy supplies the visual voice; body and controls retain native legibility.

### Hierarchy

- **Display:** 44–52 sp, extra-bold, compact line height, used once per onboarding screen.
- **Headline:** 28–34 sp, bold, for task or section titles.
- **Title:** 20–24 sp, semibold, for artifact and choice titles.
- **Body:** 16–18 sp with open line height.
- **Label:** 12–14 sp, bold and tracked only for meaningful stage labels such as `ACCOUNT · 1 OF 2`.

## Layout

Compact screens use safe-area-aware vertical flow with 24 dp side insets and a 48 dp minimum touch target. Primary actions sit after the decision content rather than floating over it. On wide devices, onboarding content remains a readable centered column instead of stretching edge to edge. Keyboard and IME insets must keep the focused field and primary action reachable.

## Elevation & Depth

Depth is primarily tonal. Raised-night controls use borders; paper artifacts use a soft downward shadow so they read as physical objects laid over the dark surface. Glows are not used as generic elevation.

## Shapes

Primary actions are full pills because they represent one decisive transition. Inputs and operational rows use 14–16 dp corners. Paper artifacts may use clipped or irregular-looking edge details only when the object metaphor is meaningful; destructive decisions retain standard native geometry.

## Components

### Buttons

- Primary actions are 56 dp high, coral-to-orange/pink, high-contrast, and use explicit verbs.
- Text buttons are at least 48 dp high and never rely on tiny underlined copy.
- Loading disables repeat taps and replaces the label with a clear progress state.

### Cards / Containers

- Raised controls use `Raised Night` with a `Wine Edge` border.
- Paper explanations use warm paper, dark ink, and generous internal padding.
- Cards group one meaningful object or decision; they are not the default wrapper for all content.

### Inputs / Fields

- Fields use persistent labels, warm-white values, and a visible focus border.
- Validation copy names the exact correction and remains visible to screen readers.

### Navigation

System Back and predictive Back semantics take precedence. Compact-width primary navigation uses four destinations. Onboarding uses a single visible back affordance plus the platform back gesture.

## Do's and Don'ts

### Do:

- **Do** preserve the canonical mockups' tactile night-out vocabulary while adapting controls to each platform.
- **Do** use semantic color utilities and shared components rather than screen-local hex values.
- **Do** keep controls reachable with large text, keyboard open, and compact-height devices.
- **Do** make loading, offline, retry, disabled, and interrupted states explicit.

### Don't:

- **Don't** use protocol jargon as primary product copy.
- **Don't** turn every section into a rounded card or every state into a colored dot.
- **Don't** request permissions before the screen demonstrates why they are needed.
- **Don't** make a provider, payment processor, or relay appear to own the user's identity.

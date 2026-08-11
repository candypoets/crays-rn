# Night Playlist

Status: approved visual direction for the next Crays UI pass. The existing
React Native implementation still uses the incumbent dark system; these
documents are the implementation contract for moving it to Night Playlist.

## Direction contract

**THESIS:** Crays is the live set of a real room: the visitor chooses what is
happening now, who is visible, and what to do next. It refuses the infinite
feed and the generic dashboard.

**OWN-WORLD:** Pale lilac and warm-white surfaces, deep-plum type, electric
blue actions, coral commitments, lime verified states, yellow attention, thin
tempo rails, clipped tabs, sticker-like imagery, and occasional full-bleed
venue moments.

**STORY:** Find a verified room → preview the vibe → choose quiet or visible
entry → see the current room → notice a person or moment → message, order, or
gift → keep the durable result in My Night and Me.

**FIRST VIEWPORT:** A current/up-next timeline is visible immediately. The
primary action is the next honest decision: Preview room, Enter room, Message,
Add a note, Add to order, or Show at the door.

**FORM:** Native stack and tab navigation remain authoritative. Night Playlist
adds choreography, not custom navigation; every animated state has a settled,
accessible equivalent and every relay-backed success waits for protocol proof.

## Mockup atlas

Each board is a visual reference, not a rasterized implementation. UI text,
state, and controls remain semantic React Native content.

| Board | Covers | File |
| --- | --- | --- |
| Room and feed | People, Room feed, person card, gift, My Night | [01-room-and-feed-v1.png](mockups/01-room-and-feed-v1.png) |
| Entry and account | Welcome, account, profile, invite, Nearby, preview, join, login/recovery | [02-entry-and-account-v1.png](mockups/02-entry-and-account-v1.png) |
| Commerce and messages | Menu, item, checkout, payment, request, conversation, gift review, order | [03-commerce-and-messages-v1.png](mockups/03-commerce-and-messages-v1.png) |
| Durable and settings | Me, My Night, orders, ticket, membership, wallet, room ended, settings | [04-durable-and-settings-v1.png](mockups/04-durable-and-settings-v1.png) |
| Discovery and access | Discover, Nearby rationale, preview, join, switch, event, ticket, room ended | [05-discovery-and-access-v1.png](mockups/05-discovery-and-access-v1.png) |

## How to use this package

- [Motion system](motion-system.md) is the shared animation contract.
- [Screen index](screen-index.md) maps the real Expo Router routes and source
  components to the right mockup board.
- The individual [screen briefs](screens/) define entry, exit, choreography,
  state transitions, accessibility fallback, and protocol boundaries.
- The canonical product and QA contract remains in `docs/screens/`; these
  briefs add visual and motion behavior without replacing relay rules.

The mockups use synthetic venue content, portraits, drinks, prices, and QR
examples. None is a production credential or a claim about live data.

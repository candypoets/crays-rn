# Primary tab navigation

## Product and interaction contract

The signed-in app has exactly three persistent destinations: **Tonight**, **Messages**, and **Me**. Tonight owns both pre-room discovery and the active room, so a person never chooses between “Room” and “Discover.” The initial route is `/room`; `/discover` remains a compatibility URL and immediately resolves to `/room` with its signed relay/room parameters intact.

Tonight is stateful: without an active session it renders Find; after confirmed entry it renders Inside; after explicit leave or automatic expiry it renders the settled Room ended state until acknowledged. All three Tonight states retain the primary footer. Messages and Me remain mounted durable destinations. A tab press changes selection in place and never publishes, subscribes, enters, leaves, or creates a stack entry. Android Back from another tab returns to Tonight. Child tasks and native sheets cover the tab navigator and return to their origin.

The bottom bar uses platform tab roles, visible labels, filled/outline Ionicons, semantic Signal Blue selection, and the full bottom safe-area inset. Labels and targets remain usable at large type. Relay loss does not disable navigation; each destination owns its loading, cached, empty, and error truth.

## Nostr and lifecycle

The navigator creates no manager and performs no protocol work. `src/nostr/manager.ts` remains the sole manager; Tonight’s route and existing providers own subscriptions and stop them on unmount. Legacy Discover navigation must not create a duplicate result set.

## QA

Unit tests own exact order, unique automation IDs, icon states, and inset math. Route tests prove Room ended remains inside Tonight and can transition to Find without a redirect loop. The registered primary-tabs device journey proves native tab selection, retained Tonight local view, Back behavior, and that the real room projection remains the same while tabs change; the Room ended journey proves footer persistence after expiry/leave.

# 03b — Room thread

## Entry and purpose

Enter by tapping the body or media of a root feed note. The route carries only the root event ID; it does not copy event content into navigation parameters. It reads the active room's existing room-scoped kind-1 and kind-7 projections. System Back and the explicit Back control return to the same feed stack entry. Leaving or expiring the room sends the route to Discover through the session contract.

## Layout and interaction

The compact header names **Post**, the room, Back, and a primary Reply action. The root note leads. Responses follow oldest first beneath an explicit divider; nested replies step inward up to three visual levels while preserving full semantic reading order. Empty threads offer **Write the first reply**. Every note keeps Reply, Like, Message, profile, and Report actions. Reply opens screen 03a against that exact response, allowing nested NIP-10 construction.

## Relay behavior

`buildRoomThread` admits only the selected root and room notes whose root/reply relationship resolves to it. Relay arrival order cannot reorder the thread: responses sort by `created_at`, then ID. Like counts deduplicate kind-7 authors per target; reply counts reflect all descendants of the root. Like and Report each own a scoped nipworker publish handle, stop on first true, false, timeout, navigation cleanup, or unmount, and never wait for all relays. No subscription or event DTO outlives the active room provider.

## States, failures, and accessibility

- loading root, ready root, no responses, populated direct/nested responses;
- root absent after EOSE (expired, removed, or unavailable), like/report pending, confirmed, rejected, timeout;
- missing profiles use Room guest; blocked authors remain excluded by the room provider;
- header and response divider are semantic, actions name author/count/state, indentation is never the only hierarchy cue, 48dp targets and text scaling remain intact.

## QA

`RoomThreadScreen.test.tsx` covers ready, loading, unavailable, empty, populated, nested actions, and alerts. `feed.test.ts` owns root selection, deterministic thread ordering/depth, reply counts, and unique-like projection. `scenario:03-room-feed` opens the thread after publishing a real reply and confirms the response is visible from the dedicated route.

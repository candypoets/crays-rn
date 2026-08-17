// Shared fixture constants for the QA harness.
//
// Verifiers must never hard-code a string that a Maestro flow types or that
// the relay bootstrap seeds. Each constant names its owner: the flow file or
// bootstrap that produces the value. Relay-backed flows receive these values
// as Maestro env vars from relay-screen-scenario.mjs (QA_* keys below); the
// entry flows are launched without env overrides and keep the literals in
// their yaml, so the comments below are the only link there — update both
// sides together.

// Typed by maestro/flows/07-account-setup.yaml (also 07b-account-recovery.yaml,
// 27-discover-handoff.yaml, cold-signup.yaml). Verified by qa-entry-verify.mjs.
export const QA_PROFILE_NAME = 'QA Alex';

// Seeded by the dev-only Test Room identity route and asserted by its flow and
// independent kind-0 verifier.
export const TEST_ROOM_QA_PROFILE_NAME = 'Maya QA';

// Typed and asserted by maestro/flows/03-room-feed.yaml (${QA_FEED_POST_TEXT}).
export const FEED_POST_TEXT = 'Meet by the east stairs.';

// Typed and asserted by maestro/flows/03-room-feed.yaml
// (${QA_FEED_REPLY_TEXT}); independently verified as a marked NIP-10 reply.
export const FEED_REPLY_TEXT = 'I will meet you by the late set.';

// Selected via testID intent-<value> and asserted by
// maestro/flows/11-join-visible.yaml (${QA_JOIN_INTENT}).
export const JOIN_VISIBLE_INTENT = 'business';

// Typed and asserted by maestro/flows/11-join-visible.yaml (${QA_JOIN_CONTEXT}).
export const JOIN_VISIBLE_CONTEXT = 'Here for the founders meetup';

// Typed and asserted by maestro/flows/messages-home.yaml
// (${QA_MESSAGE_REQUEST_TEXT}). Note: 22-message-request.yaml taps the
// app-owned suggestion chip of the same text (STARTERS in
// src/screens/messages/MessageRequestScreen.tsx); that string is owned by the
// app, not by this fixture.
export const MESSAGE_REQUEST_TEXT = 'What are you drinking?';

// Typed by maestro/flows/conversation.yaml (${QA_CONVERSATION_REPLY_TEXT}).
export const CONVERSATION_REPLY_TEXT = 'Yes — see you there.';

// Protocol receipt emitted by the app itself (message-request acceptance);
// no flow types it, but verify-conversation-actions.mjs decrypts and checks it.
export const CONVERSATION_ACCEPTANCE_TEXT = 'Conversation accepted';

// Default room display name seeded by relay-bootstrap.mjs (overridable via
// CRAYS_TEST_ROOM_NAME). Verifiers should prefer state.room_name and fall
// back to this constant for older state files.
export const ROOM_DISPLAY_NAME = 'The Skyline Room';

// Room summary seeded into the root-authorized NIP-53 kind-30312 definition;
// asserted by maestro/flows/10-room-preview.yaml (${QA_ROOM_ABOUT}).
export const ROOM_ABOUT = 'Rooftop jazz, cocktails and a view over the city.';

// Fixture people seeded by relay-bootstrap.mjs as kind-0 profiles plus visible
// presence; consumed by verify-room-consumed.mjs.
export const FIXTURE_PEOPLE = [
  ['Maya', 'Here for the jazz'],
  ['Jonas', 'Ask me about the view'],
  ['Lea', 'Trying the Negroni'],
];

// Menu products seeded by relay-bootstrap.mjs (d slug, name, description,
// price, section, product kind). Consumed by verify-room-consumed.mjs.
export const FIXTURE_PRODUCTS = [
  ['mezcal-negroni', 'Mezcal Negroni', 'Smoky, bitter, orange', '12.00', 'Cocktails', 'drink'],
  ['rooftop-lager', 'Rooftop Lager', 'Crisp local lager', '7.00', 'Beer', 'drink'],
  ['marinated-olives', 'Marinated olives', 'Citrus and rosemary', '6.00', 'Snacks', 'food'],
];

// Membership and calendar-event fixtures seeded by relay-bootstrap.mjs.
export const FIXTURE_MEMBERSHIP_NAME = 'Skyline Regular';
export const FIXTURE_EVENT_TITLE = 'Rooftop Jazz';

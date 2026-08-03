#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);

const contracts = [
  ['00-foundation.md', '00-foundation.yaml', 'qa-00-foundation.mjs'],
  ['01-people.md', '01-people.yaml', 'qa-01-people.mjs'],
  ['02-first-contact.md', '02-first-contact.yaml', 'qa-02-first-contact.mjs'],
  ['03-room-feed.md', '03-room-feed.yaml', 'qa-03-room-feed.mjs'],
  ['04-gift-select.md', '04-gift-select.yaml', 'qa-04-gift-select.mjs'],
  ['05-my-night.md', '05-my-night.yaml', 'qa-05-my-night.mjs'],
  ['06-cold-welcome.md', '06-cold-welcome.yaml', 'qa-06-cold-welcome.mjs'],
  ['06b-account-access.md', '06b-account-access.yaml', 'qa-06b-account-access.mjs'],
  ['07-account-setup.md', '07-account-setup.yaml', 'qa-07-account-setup.mjs'],
  ['07b-account-recovery.md', '07b-account-recovery.yaml', 'qa-07b-account-recovery.mjs'],
  ['08-invite-preview.md', '08-invite-preview.yaml', 'qa-08-invite-preview.mjs'],
  ['08b-invite-accepted.md', '08b-invite-accepted.yaml', 'qa-08b-invite-accepted.mjs'],
  ['09-returning-login.md', '09-returning-login.yaml', 'qa-09-returning-login.mjs'],
  ['10-room-preview.md', '10-room-preview.yaml', 'qa-10-room-preview.mjs'],
  ['10b-bluetooth-rationale.md', '10b-bluetooth-rationale.yaml', 'qa-10b-bluetooth-rationale.mjs'],
  ['11-join-privacy.md', '11-join-privacy.yaml', 'qa-11-join-privacy.mjs'],
  ['12-menu.md', '12-menu.yaml', 'qa-12-menu.mjs'],
  ['13-item.md', '13-item.yaml', 'qa-13-item.mjs'],
  ['14-review-pay.md', '14-review-pay.yaml', 'qa-14-review-pay.mjs'],
  ['15-order-detail.md', '15-order-detail.yaml', 'qa-15-order-detail.mjs'],
  ['16-me.md', '16-me.yaml', 'qa-16-me.mjs'],
  ['17-orders.md', '17-orders.yaml', 'qa-17-orders.mjs'],
  ['18-membership-offer.md', '18-membership-offer.yaml', 'qa-18-membership-offer.mjs'],
  ['19-membership-detail.md', '19-membership-detail.yaml', 'qa-19-membership-detail.mjs'],
  ['20-room-event.md', '20-room-event.yaml', 'qa-20-room-event.mjs'],
  ['20b-tickets.md', '20b-tickets.yaml', 'qa-20b-tickets.mjs'],
  ['20c-ticket-detail.md', '20c-ticket-detail.yaml', 'qa-20c-ticket-detail.mjs'],
  ['21-room-ended.md', '21-room-ended.yaml', 'qa-21-room-ended.mjs'],
  ['22-message-request.md', '22-message-request.yaml', 'qa-22-message-request.mjs'],
  ['23-gift-review.md', '23-gift-review.yaml', 'qa-23-gift-review.mjs'],
  ['24-payment-methods.md', '24-payment-methods.yaml', 'qa-24-payment-methods.mjs'],
  ['25-wallet.md', '25-wallet.yaml', 'qa-25-wallet.mjs'],
  ['26-add-funds.md', '26-add-funds.yaml', 'qa-26-add-funds.mjs'],
  ['27-discover.md', '27-discover.yaml', 'qa-27-discover.mjs'],
  ['28-switch-room.md', '28-switch-room.yaml', 'qa-28-switch-room.mjs'],
  ['entry-router.md', 'cold-signup.yaml', 'qa-cold-signup.mjs'],
  ['memberships.md', 'memberships.yaml', 'qa-memberships.mjs'],
  ['messages.md', 'conversation.yaml', 'qa-conversation.mjs'],
  ['primary-tabs.md', 'primary-tabs.yaml', 'qa-primary-tabs.mjs'],
  ['settings.md', 'settings.yaml', 'qa-settings.mjs'],
];

// Negative-path scenarios that harden an existing screen spec rather than
// adding a new one (the owning doc is noted for traceability). They get the
// same runner/flow/launch checks as screen contracts.
const additionalScenarios = [
  ['08b-invite-accepted.md', '08b-invite-redeemed-twice.yaml', 'qa-08b-invite-redeemed-twice.mjs'],
  ['20b-tickets.md', '20d-rsvp-rejected.yaml', 'qa-20d-rsvp-rejected.mjs'],
  ['11-join-privacy.md', '11c-join-relay-unavailable.yaml', 'qa-11c-join-relay-unavailable.mjs'],
];

// Screen spec -> jest test that covers it, by existing naming conventions.
const screenTests = {
  '00-foundation.md': 'src/screens/__tests__/FoundationScreen.test.tsx',
  '01-people.md': 'src/screens/room/__tests__/RoomScreen.test.tsx',
  '02-first-contact.md': 'src/screens/room/__tests__/FirstContactScreen.test.tsx',
  '03-room-feed.md': 'src/screens/room/__tests__/RoomScreen.test.tsx',
  '04-gift-select.md': 'src/screens/commerce/__tests__/CommerceScreens.test.tsx',
  '05-my-night.md': 'src/screens/durable/__tests__/DurableScreens.test.tsx',
  '06-cold-welcome.md': 'src/screens/onboarding/__tests__/ColdWelcomeScreen.test.tsx',
  '06b-account-access.md': 'src/screens/onboarding/__tests__/AccountAccessScreen.test.tsx',
  '07-account-setup.md': 'src/screens/onboarding/__tests__/ProfileSetupScreen.test.tsx',
  '07b-account-recovery.md': 'src/screens/onboarding/__tests__/RecoveryScreen.test.tsx',
  '08-invite-preview.md': 'src/screens/onboarding/__tests__/InviteScreens.test.tsx',
  '08b-invite-accepted.md': 'src/screens/onboarding/__tests__/InviteScreens.test.tsx',
  '09-returning-login.md': 'src/screens/onboarding/__tests__/InviteScreens.test.tsx',
  '10-room-preview.md': 'src/screens/discovery/__tests__/RoomPreviewScreen.test.tsx',
  '10b-bluetooth-rationale.md': 'src/screens/discovery/__tests__/BluetoothRationaleScreen.test.tsx',
  '11-join-privacy.md': 'src/screens/discovery/__tests__/JoinPrivacyScreen.test.tsx',
  '12-menu.md': 'src/screens/commerce/__tests__/CommerceScreens.test.tsx',
  '13-item.md': 'src/screens/commerce/__tests__/CommerceScreens.test.tsx',
  '14-review-pay.md': 'src/screens/commerce/__tests__/CommerceScreens.test.tsx',
  '15-order-detail.md': 'src/screens/durable/__tests__/DurableScreens.test.tsx',
  '16-me.md': 'src/screens/durable/__tests__/DurableScreens.test.tsx',
  '17-orders.md': 'src/screens/durable/__tests__/DurableScreens.test.tsx',
  '18-membership-offer.md': 'src/screens/durable/__tests__/DurableScreens.test.tsx',
  '19-membership-detail.md': 'src/screens/durable/__tests__/DurableScreens.test.tsx',
  '20-room-event.md': 'src/screens/durable/__tests__/DurableScreens.test.tsx',
  '20b-tickets.md': 'src/screens/durable/__tests__/TicketScreens.test.tsx',
  '20c-ticket-detail.md': 'src/screens/durable/__tests__/TicketScreens.test.tsx',
  '21-room-ended.md': 'src/screens/room/__tests__/LeaveAndSwitchScreens.test.tsx',
  '22-message-request.md': 'src/screens/messages/__tests__/MessageRequestScreen.test.tsx',
  '23-gift-review.md': 'src/screens/commerce/__tests__/CommerceScreens.test.tsx',
  '24-payment-methods.md': 'src/screens/commerce/__tests__/CommerceScreens.test.tsx',
  '25-wallet.md': 'src/screens/durable/__tests__/DurableScreens.test.tsx',
  '26-add-funds.md': 'src/screens/durable/__tests__/DurableScreens.test.tsx',
  '27-discover.md': 'src/discovery/__tests__/blePointer.test.ts',
  '28-switch-room.md': 'src/screens/room/__tests__/LeaveAndSwitchScreens.test.tsx',
  'memberships.md': 'src/screens/durable/__tests__/DurableScreens.test.tsx',
  'messages.md': 'src/screens/messages/__tests__/MessagesScreens.test.tsx',
  'primary-tabs.md': 'src/navigation/__tests__/primaryTabs.test.ts',
  'settings.md': 'src/screens/settings/__tests__/SettingsScreen.test.tsx',
};

// Known exceptions: routing glue with no dedicated screen component. Warn,
// do not fail; remove entries as real coverage lands.
const testExemptions = new Set(['entry-router.md']);

const documented = readdirSync(resolve(root, 'docs/screens')).filter((name) => name.endsWith('.md')).sort();
const registered = contracts.map(([doc]) => doc).sort();
if (JSON.stringify(documented) !== JSON.stringify(registered)) {
  throw new Error(`Screen contract registry mismatch.\nDocumented: ${documented.join(', ')}\nRegistered: ${registered.join(', ')}`);
}

const allScenarios = [...contracts, ...additionalScenarios];
for (const [doc, flow, runner] of allScenarios) {
  const flowPath = resolve(root, 'maestro/flows', flow);
  const runnerPath = resolve(root, '.qa', runner);
  for (const file of [resolve(root, 'docs/screens', doc), flowPath, runnerPath]) {
    if (!existsSync(file)) throw new Error(`Missing screen contract artifact: ${file}`);
  }

  // The runner must reference its registered flow, and every flow it
  // references must exist.
  const runnerSource = readFileSync(runnerPath, 'utf8');
  const referenced = [...runnerSource.matchAll(/maestro\/flows\/[\w.-]+\.yaml/g)].map((match) => match[0].replace('maestro/flows/', ''));
  if (!referenced.includes(flow)) throw new Error(`${runner} does not reference its registered flow maestro/flows/${flow}`);
  for (const name of referenced) {
    if (!existsSync(resolve(root, 'maestro/flows', name))) throw new Error(`${runner} references missing maestro/flows/${name}`);
  }
}

// Every contract flow must reach the shared launch (transitively) so all
// scenarios share Metro/dev-client startup.
const flowDir = resolve(root, 'maestro/flows');
const runFlowTargets = (name) => {
  const source = readFileSync(resolve(flowDir, name), 'utf8');
  return [...source.matchAll(/runFlow:\s*([\w./-]+\.yaml)/g)].map((match) => match[1]);
};
const reachesLaunch = (name, seen = new Set()) => {
  if (name === 'launch.yaml') return true;
  if (seen.has(name)) return false;
  seen.add(name);
  return runFlowTargets(name).some((target) => reachesLaunch(target.replace(/^.*\//, ''), seen));
};
for (const [, flow] of allScenarios) {
  if (!reachesLaunch(flow)) throw new Error(`maestro/flows/${flow} does not run the shared maestro/flows/launch.yaml startup (directly or transitively)`);
}

// Every screen spec needs at least one jest test file.
const warnings = [];
for (const [doc] of contracts) {
  const testFile = screenTests[doc];
  if (!testFile) {
    if (testExemptions.has(doc)) { warnings.push(`no jest test mapped for ${doc} (warn-listed exception)`); continue; }
    throw new Error(`No jest test mapping for ${doc}; add one to screenTests in .qa/verify-screen-contracts.mjs`);
  }
  if (!existsSync(resolve(root, testFile))) throw new Error(`Mapped jest test for ${doc} is missing: ${testFile}`);
}

for (const warning of warnings) console.log(`warn - ${warning}`);
console.log(`CRAYS SCREEN CONTRACTS PASS: ${contracts.length} specs and ${additionalScenarios.length} extra scenarios each have a Maestro flow (launch-linked), a referencing .qa runner, and mapped jest coverage`);

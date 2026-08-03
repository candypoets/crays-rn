#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs';
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
  ['settings.md', 'settings.yaml', 'qa-settings.mjs'],
];

const documented = readdirSync(resolve(root, 'docs/screens')).filter((name) => name.endsWith('.md')).sort();
const registered = contracts.map(([doc]) => doc).sort();
if (JSON.stringify(documented) !== JSON.stringify(registered)) {
  throw new Error(`Screen contract registry mismatch.\nDocumented: ${documented.join(', ')}\nRegistered: ${registered.join(', ')}`);
}

for (const [doc, flow, runner] of contracts) {
  const files = [
    resolve(root, 'docs/screens', doc),
    resolve(root, 'maestro/flows', flow),
    resolve(root, '.qa', runner),
  ];
  for (const file of files) if (!existsSync(file)) throw new Error(`Missing screen contract artifact: ${file}`);
}

console.log(`CRAYS SCREEN CONTRACTS PASS: ${contracts.length} specs each have a Maestro flow and named .qa lifecycle`);

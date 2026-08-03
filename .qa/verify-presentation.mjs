#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { verifyEvent } from 'nostr-tools';
import { assert, readState } from './relay-lib.mjs';

const state = readState();
if (!state) throw new Error('missing QA state');
const expected = new Set([state.membership_award_id, state.pass_award_id, state.event_access_award_id].filter(Boolean));
const dump = execFileSync('adb', ['logcat', '-d'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const payloads = [...dump.matchAll(/nuts:present:[A-Za-z0-9_-]+/g)].map((match) => match[0]);
assert(payloads.length > 0, 'app logged a live presentation payload');
const decode = (payload) => {
  const encoded = payload.slice('nuts:present:'.length).replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
};
const tag = (event, name) => event.tags.find((candidate) => candidate[0] === name)?.[1] || '';
const now = Math.floor(Date.now() / 1000);
const candidates = payloads.map(decode).filter((event) => expected.has(tag(event, 'e')));
assert(candidates.length > 0, 'presentation references a fixture kind-8 award');
const event = candidates.at(-1);
assert(event.kind === 27236, 'presentation uses kind 27236');
assert(verifyEvent(event), 'presentation has a valid app identity signature');
assert(tag(event, 'type') === 'nuts_entitlement_presentation', 'presentation type is explicit');
assert(Boolean(tag(event, 'nonce')), 'presentation contains a one-time nonce');
assert(tag(event, 'r') === state.relay_url, 'presentation carries the signed authoritative venue relay');
const expiration = Number(tag(event, 'expiration'));
assert(expiration >= now && expiration <= event.created_at + 90, 'presentation is live for no more than 90 seconds');
assert(Boolean(tag(event, 'order')) !== Boolean(tag(event, 'event')), 'presentation has exactly one fulfillment context');
console.log('CRAYS ENTITLEMENT PRESENTATION VERIFY PASS');

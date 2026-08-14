#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';

// Owns the validated local-profile pass, current-room return navigation, and
// durable Me ledger against the real reserved-room projection.
runRelayScreenScenario({
  flow: 'maestro/flows/16-me.yaml',
  scenario: '16-me',
  verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-order-consumed.mjs', '.qa/verify-me-local-profile.mjs'],
});

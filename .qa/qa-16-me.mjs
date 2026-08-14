#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';

// Owns current-room return navigation plus the durable Me ledger against the
// real reserved-room projection and its independent protocol verifiers.
runRelayScreenScenario({
  flow: 'maestro/flows/16-me.yaml',
  scenario: '16-me',
  verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-order-consumed.mjs'],
});

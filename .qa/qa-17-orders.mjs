#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';

// Maestro owns user-facing classification/copy; these verifiers own the exact
// signed product award and ready venue status behind the visible row.
runRelayScreenScenario({
  flow: 'maestro/flows/17-orders.yaml',
  scenario: '17-orders',
  verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-order-consumed.mjs'],
});

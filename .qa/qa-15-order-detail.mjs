#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';

runRelayScreenScenario({
  flow: 'maestro/flows/15-order-detail.yaml',
  scenario: '15-order-detail',
  verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-order-consumed.mjs'],
});

#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';

runRelayScreenScenario({
  flow: 'maestro/flows/05-my-night.yaml',
  scenario: '05-my-night',
  verifiers: [
    '.qa/verify-room-consumed.mjs',
    '.qa/verify-order-consumed.mjs',
    '.qa/verify-presentation.mjs',
  ],
});

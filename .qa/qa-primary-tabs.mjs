#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';

runRelayScreenScenario({
  flow: 'maestro/flows/primary-tabs.yaml',
  scenario: 'primary-tabs',
  verifiers: ['.qa/verify-room-consumed.mjs'],
});

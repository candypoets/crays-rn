#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';

runRelayScreenScenario({
  flow: 'maestro/flows/leave-room.yaml',
  scenario: 'leave-room',
  verifiers: ['.qa/verify-left-room.mjs'],
});

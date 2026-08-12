#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';

// NIP-53 is regular replaceable. Use the dedicated fourth identity so the
// app's enter/leave replacements cannot overwrite a seeded roster fixture.
runRelayScreenScenario({
  flow: 'maestro/flows/21-room-ended.yaml',
  scenario: '21-room-ended',
  qaUserIndex: 3,
  verifiers: ['.qa/verify-left-room.mjs'],
});

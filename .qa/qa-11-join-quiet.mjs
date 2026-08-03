#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/11-join-quiet.yaml', scenario: '11-join-quiet', qaUserIndex: 3, verifiers: ['.qa/verify-quiet-entry.mjs'] });

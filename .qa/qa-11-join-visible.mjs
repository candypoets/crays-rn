#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/11-join-visible.yaml', scenario: '11-join-visible', qaUserIndex: 3, verifiers: ['.qa/verify-visible-entry.mjs'] });

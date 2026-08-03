#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/01-people.yaml', scenario: '01-people', verifiers: ['.qa/verify-room-consumed.mjs'] });

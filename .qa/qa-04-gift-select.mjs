#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/04-gift-select.yaml', scenario: '04-gift-select', verifiers: ['.qa/verify-room-consumed.mjs'] });

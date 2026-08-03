#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/12-menu.yaml', scenario: '12-menu', verifiers: ['.qa/verify-room-consumed.mjs'] });

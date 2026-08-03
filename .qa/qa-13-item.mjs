#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/13-item.yaml', scenario: '13-item', verifiers: ['.qa/verify-room-consumed.mjs'] });

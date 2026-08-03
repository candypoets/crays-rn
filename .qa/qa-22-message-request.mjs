#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/22-message-request.yaml', scenario: '22-message-request', verifiers: ['.qa/verify-room-consumed.mjs'] });

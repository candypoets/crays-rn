#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/20c-ticket-detail.yaml', scenario: '20c-ticket-detail', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-presentation.mjs'] });

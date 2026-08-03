#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/23-gift-review.yaml', scenario: '23-gift-review', verifiers: ['.qa/verify-room-consumed.mjs'] });

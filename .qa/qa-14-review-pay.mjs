#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/14-review-pay.yaml', scenario: '14-review-pay', verifiers: ['.qa/verify-room-consumed.mjs'] });

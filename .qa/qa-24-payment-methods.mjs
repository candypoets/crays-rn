#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/24-payment-methods.yaml', scenario: '24-payment-methods', verifiers: ['.qa/verify-room-consumed.mjs'] });

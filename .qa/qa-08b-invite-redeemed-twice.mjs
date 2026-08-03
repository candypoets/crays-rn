#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/08b-invite-redeemed-twice.yaml', scenario: '08b-invite-redeemed-twice', verifiers: ['.qa/verify-invite-redeemed-once.mjs'] });

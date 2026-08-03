#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/08b-invite-accepted.yaml', scenario: '08b-invite-accepted', verifiers: ['.qa/verify-invite-redeemed.mjs'] });

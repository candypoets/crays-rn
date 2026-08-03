#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/memberships.yaml', scenario: 'memberships', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-presentation.mjs'] });

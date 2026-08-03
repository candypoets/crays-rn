#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/conversation-not-now.yaml', scenario: 'conversation-not-now', verifiers: ['.qa/verify-conversation-not-now.mjs'] });

#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/messages-home.yaml', scenario: 'messages-home', verifiers: ['.qa/verify-message-request.mjs'] });

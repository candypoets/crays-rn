#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/conversation.yaml', scenario: 'conversation', verifiers: ['.qa/verify-conversation-actions.mjs', '.qa/verify-venue-report.mjs'] });

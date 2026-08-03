#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/settings.yaml', scenario: 'settings', verifiers: ['.qa/verify-room-consumed.mjs'] });

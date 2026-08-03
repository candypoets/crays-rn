#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/21-room-ended.yaml', scenario: '21-room-ended', verifiers: ['.qa/verify-left-room.mjs'] });

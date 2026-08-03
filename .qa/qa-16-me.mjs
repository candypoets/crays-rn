#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/16-me.yaml', scenario: '16-me', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-order-consumed.mjs'] });

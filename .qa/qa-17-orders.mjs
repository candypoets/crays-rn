#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/17-orders.yaml', scenario: '17-orders', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-order-consumed.mjs'] });

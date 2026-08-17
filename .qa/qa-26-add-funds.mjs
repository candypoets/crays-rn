#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/26-add-funds.yaml', scenario: '26-add-funds', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-wallet-no-side-effects.mjs'] });

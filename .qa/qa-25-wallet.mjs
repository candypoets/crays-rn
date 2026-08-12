#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/25-wallet.yaml', scenario: '25-wallet', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-wallet-no-side-effects.mjs'] });

#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/19-membership-detail.yaml', scenario: '19-membership-detail', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-presentation.mjs'] });

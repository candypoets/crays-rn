#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/18-membership-offer.yaml', scenario: '18-membership-offer', verifiers: ['.qa/verify-room-consumed.mjs'] });

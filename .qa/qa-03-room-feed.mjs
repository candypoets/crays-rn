#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/03-room-feed.yaml', scenario: '03-room-feed', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-feed-actions.mjs'] });

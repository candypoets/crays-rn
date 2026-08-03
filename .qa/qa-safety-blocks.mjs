#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/safety-blocks.yaml', scenario: 'safety-blocks', verifiers: ['.qa/verify-block-side-effects.mjs'] });

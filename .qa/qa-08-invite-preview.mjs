#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/08-invite-preview.yaml', scenario: '08-invite-preview' });

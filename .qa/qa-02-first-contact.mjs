#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/02-first-contact.yaml', scenario: '02-first-contact', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-venue-report.mjs'] });

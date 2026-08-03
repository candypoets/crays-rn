#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({ flow: 'maestro/flows/20b-tickets.yaml', scenario: '20b-tickets', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-event-rsvp.mjs'] });

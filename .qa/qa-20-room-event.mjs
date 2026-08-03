#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs'; runRelayScreenScenario({ flow: 'maestro/flows/20-room-event.yaml', scenario: '20-room-event', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-event-rsvp.mjs'] });

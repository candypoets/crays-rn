#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';

// The flow owns plain product language; the presentation verifier owns the
// exact signed kind-27236 payload kept out of customer-facing copy.
runRelayScreenScenario({ flow: 'maestro/flows/20c-ticket-detail.yaml', scenario: '20c-ticket-detail', verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-presentation.mjs'] });

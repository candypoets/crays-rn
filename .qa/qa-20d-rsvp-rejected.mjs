#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';

// qaUserIndex 3 is outside the pre-authorized fixture users (0-2), and
// CRAYS_QA_PREAUTHORIZE=0 keeps the badge issuer from granting it membership,
// so the badge-gated relay rejects every write from the app identity —
// including the RSVP this scenario attempts.
runRelayScreenScenario({
  flow: 'maestro/flows/20d-rsvp-rejected.yaml',
  scenario: '20d-rsvp-rejected',
  qaUserIndex: 3,
  bootstrapEnv: { CRAYS_QA_PREAUTHORIZE: '0' },
  verifiers: ['.qa/verify-rsvp-rejected.mjs'],
});

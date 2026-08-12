#!/usr/bin/env node
import { runRelayScreenScenario } from './relay-screen-scenario.mjs';
runRelayScreenScenario({
  flow: 'maestro/flows/14-review-pay.yaml',
  scenario: '14-review-pay',
  qaUserIndex: 3,
  bootstrapEnv: { CRAYS_QA_MINT_INVITE: '0', CRAYS_QA_PREAUTHORIZE: '0' },
  checkoutAdapter: true,
  verifiers: ['.qa/verify-room-consumed.mjs', '.qa/verify-checkout-order.mjs'],
});

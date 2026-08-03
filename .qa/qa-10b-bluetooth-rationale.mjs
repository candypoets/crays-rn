#!/usr/bin/env node
import { runScreenScenario } from './qa-entry-lib.mjs';
runScreenScenario({ flow: 'maestro/flows/10b-bluetooth-rationale.yaml', scenario: '10b-bluetooth-rationale' });

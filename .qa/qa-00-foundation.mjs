#!/usr/bin/env node
import { runScreenScenario } from './qa-entry-lib.mjs';

runScreenScenario({ flow: 'maestro/flows/00-foundation.yaml', scenario: '00-foundation' });

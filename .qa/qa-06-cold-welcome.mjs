#!/usr/bin/env node
import { runScreenScenario } from './qa-entry-lib.mjs';

runScreenScenario({ flow: 'maestro/flows/06-cold-welcome.yaml', scenario: '06-cold-welcome' });

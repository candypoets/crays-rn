#!/usr/bin/env node
import { bootstrapEntryQa } from './qa-entry-lib.mjs';

bootstrapEntryQa(process.argv[2] || 'cold-signup');

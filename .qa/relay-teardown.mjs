#!/usr/bin/env node
import { clearState, deleteRelay, listRelays, loadKeys, readState, removeRelayVolume, requireCoordinator } from './relay-lib.mjs';

const keys = loadKeys();
await requireCoordinator();

async function remove(id, label) {
  try {
    await deleteRelay(id, keys);
    console.log(`ok - deleted relay ${id}${label ? ` (${label})` : ''}`);
  } catch (error) {
    console.log(`warn - relay ${id} delete failed: ${error.message.split('\n')[0]}`);
  }
  removeRelayVolume(id);
}

if (process.argv.includes('--sweep')) {
  const relays = await listRelays(keys);
  const targets = relays.filter((relay) => (relay.domain || '').startsWith('craysqa-'));
  for (const relay of targets) await remove(relay.id, relay.domain);
  clearState();
  console.log('CRAYS RELAY SWEEP PASS');
  process.exit(0);
}

const state = readState();
if (!state?.id) throw new Error('no Crays QA relay state; use --sweep for crash recovery');
await remove(state.id, state.name);
clearState();
console.log('CRAYS RELAY TEARDOWN PASS');

import type { NostrManagerLike } from '@candypoets/nipworker';
import {
  ReactNativeBackend,
  hasReactNativeModule,
  setManager,
} from '@candypoets/nipworker/react-native';

import { nostrAuthStore } from '@/nostr/auth';

export type NostrRuntimeStatus = 'ready' | 'unavailable' | 'error';

export type NostrRuntime = {
  manager: NostrManagerLike | null;
  status: NostrRuntimeStatus;
  detail?: string;
};

let sharedRuntime: NostrRuntime | null = null;

/**
 * Creates the single nipworker runtime used throughout the app.
 *
 * Venue relays are intentionally not hard-coded here. A room descriptor or a
 * screen-specific query owns its relay set and stable subscription IDs.
 */
export function getNostrRuntime(): NostrRuntime {
  if (sharedRuntime) return sharedRuntime;

  if (!hasReactNativeModule()) {
    const detail = 'Use a Crays development build; Expo Go cannot load nipworker.';
    nostrAuthStore.resolveUnavailable(detail);
    sharedRuntime = {
      manager: null,
      status: 'unavailable',
      detail,
    };
    return sharedRuntime;
  }

  try {
    const manager = new ReactNativeBackend({
      defaultRelays: [],
      indexerRelays: [],
      logLevel: __DEV__ ? 'info' : 'warn',
    });
    // ReactNativeBackend restores its persisted session in a deferred callback.
    // Bind synchronously after construction so that first auth event cannot race
    // the React tree mounting behind RuntimeGate.
    nostrAuthStore.bind(manager);
    setManager(manager);
    sharedRuntime = { manager, status: 'ready' };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    nostrAuthStore.resolveUnavailable(detail);
    console.warn('[nostr] failed to initialize nipworker', error);
    sharedRuntime = { manager: null, status: 'error', detail };
  }

  return sharedRuntime;
}

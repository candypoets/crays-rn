import type { NostrManagerLike } from '@candypoets/nipworker/react-native';

export type NostrAuthSnapshot = {
  error: string | null;
  hasSigner: boolean;
  pubkey: string | null;
  resolved: boolean;
};

type AuthDetail = {
  error?: string | null;
  hasSigner?: boolean;
  pubkey?: string | null;
};

const INITIAL_AUTH: NostrAuthSnapshot = {
  error: null,
  hasSigner: false,
  pubkey: null,
  resolved: false,
};

export function createNostrAuthStore() {
  let manager: NostrManagerLike | null = null;
  let snapshot = INITIAL_AUTH;
  const listeners = new Set<() => void>();

  const publish = (next: NostrAuthSnapshot) => {
    if (
      snapshot.error === next.error &&
      snapshot.hasSigner === next.hasSigner &&
      snapshot.pubkey === next.pubkey &&
      snapshot.resolved === next.resolved
    ) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  const onAuth = ((event: globalThis.Event & { detail?: AuthDetail }) => {
    const detail = event.detail;
    publish({
      error: detail?.error ?? null,
      hasSigner: detail?.hasSigner === true,
      pubkey: detail?.pubkey ?? null,
      resolved: true,
    });
  }) as EventListener;

  const onLogout = () => {
    publish({ error: null, hasSigner: false, pubkey: null, resolved: true });
  };

  return {
    bind(nextManager: NostrManagerLike) {
      if (manager === nextManager) return;
      if (manager) {
        manager.removeEventListener('auth', onAuth);
        manager.removeEventListener('logout', onLogout);
      }
      manager = nextManager;
      snapshot = INITIAL_AUTH;
      manager.addEventListener('auth', onAuth);
      manager.addEventListener('logout', onLogout);
    },
    getSnapshot: () => snapshot,
    resolveUnavailable(error: string) {
      publish({ error, hasSigner: false, pubkey: null, resolved: true });
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const nostrAuthStore = createNostrAuthStore();

import { createNostrAuthStore } from '@/nostr/auth';

function fakeManager() {
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  const emit = (type: string, detail?: unknown) => {
    for (const listener of listeners.get(type) ?? []) {
      const event = { detail } as unknown as Event;
      if (typeof listener === 'function') listener(event);
      else listener.handleEvent(event);
    }
  };
  return {
    addEventListener: jest.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      const current = listeners.get(type) ?? new Set();
      current.add(listener);
      listeners.set(type, current);
    }),
    emit,
    removeEventListener: jest.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.get(type)?.delete(listener);
    }),
  };
}

describe('nipworker auth callback state', () => {
  it('retains the deferred signer callback for consumers that mount later', () => {
    const manager = fakeManager();
    const store = createNostrAuthStore();
    const listener = jest.fn();
    store.bind(manager as never);
    store.subscribe(listener);

    const pubkey = 'a'.repeat(64);
    manager.emit('auth', { hasSigner: true, pubkey });

    expect(store.getSnapshot()).toEqual({ error: null, hasSigner: true, pubkey, resolved: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps a resolved read-only identity distinct from an available signer', () => {
    const manager = fakeManager();
    const store = createNostrAuthStore();
    store.bind(manager as never);

    manager.emit('auth', { hasSigner: false, pubkey: 'a'.repeat(64) });

    expect(store.getSnapshot()).toMatchObject({ hasSigner: false, resolved: true });
  });

  it('clears the live signer when nipworker logs out', () => {
    const manager = fakeManager();
    const store = createNostrAuthStore();
    store.bind(manager as never);
    manager.emit('auth', { hasSigner: true, pubkey: 'a'.repeat(64) });

    manager.emit('logout');

    expect(store.getSnapshot()).toEqual({ error: null, hasSigner: false, pubkey: null, resolved: true });
  });
});

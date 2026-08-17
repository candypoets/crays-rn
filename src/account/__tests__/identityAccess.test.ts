/* eslint-disable import/first */
jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  deleteItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@candypoets/nipworker/hooks', () => ({ useSignEvent: jest.fn() }));
jest.mock('@/nostr/manager', () => ({ getNostrRuntime: jest.fn() }));

import * as SecureStore from 'expo-secure-store';
import { getPublicKey, nip19 } from 'nostr-tools';

import { connectNip46Signer, importNostrSecret } from '@/account/account';
import { getNostrRuntime } from '@/nostr/manager';

const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

function fakeManager(authPubkey: string, account?: { type: string; payload: unknown }) {
  const listeners = new Set<EventListenerOrEventListenerObject>();
  let active: string | null = null;
  const accounts: Record<string, { type: string; payload: unknown }> = {};
  const emit = (detail: unknown) => {
    for (const listener of listeners) {
      if (typeof listener === 'function') listener({ detail } as unknown as Event);
      else listener.handleEvent({ detail } as unknown as Event);
    }
  };
  return {
    PERPETUAL_SUBSCRIPTIONS: [],
    addEventListener: jest.fn((_type: string, listener: EventListenerOrEventListenerObject) => listeners.add(listener)),
    cleanup: jest.fn(),
    clearMeshProfile: jest.fn(),
    createShortId: jest.fn(),
    getAccounts: jest.fn(() => accounts),
    getActivePubkey: jest.fn(() => active),
    getBuffer: jest.fn(),
    getPublicKey: jest.fn(),
    getRelayStatuses: jest.fn(() => new Map()),
    getSubscriptionCount: jest.fn(() => 0),
    logout: jest.fn(() => { active = null; }),
    publish: jest.fn(),
    removeAccount: jest.fn(),
    removeEventListener: jest.fn((_type: string, listener: EventListenerOrEventListenerObject) => listeners.delete(listener)),
    setMeshProfile: jest.fn(),
    setNip07: jest.fn(),
    setNip46Bunker: jest.fn(),
    setNip46QR: jest.fn(),
    setPubkey: jest.fn(),
    setSigner: jest.fn((type: string, payload: unknown) => queueMicrotask(() => {
      active = authPubkey;
      accounts[authPubkey] = account ?? { type, payload };
      emit({ hasSigner: true, pubkey: authPubkey });
    })),
    signEvent: jest.fn(),
    subscribe: jest.fn(),
    switchAccount: jest.fn(),
    unsubscribe: jest.fn(),
  };
}

describe('existing Nostr identity access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  });

  it('imports an nsec only after signer ownership is confirmed and leaves persistence to nipworker', async () => {
    const bytes = Uint8Array.from([...new Array(31).fill(0), 3]);
    const nsec = nip19.nsecEncode(bytes);
    const pubkey = getPublicKey(bytes);
    const manager = fakeManager(pubkey);
    jest.mocked(getNostrRuntime).mockReturnValue({ manager, status: 'ready' });

    await expect(importNostrSecret(`  ${nsec}  `)).resolves.toEqual({ nsec, pubkey, signer: 'privkey' });
    expect(manager.setSigner).toHaveBeenCalledWith('privkey', hex(bytes));
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(JSON.stringify(jest.mocked(SecureStore.setItemAsync).mock.calls)).not.toContain(nsec);
  });

  it('persists a reusable NIP-46 bunker session without an nsec', async () => {
    const pubkey = 'a'.repeat(64);
    const payload = {
      clientSecret: 'c'.repeat(64),
      url: `bunker://${pubkey}?relay=${encodeURIComponent('wss://relay.example')}`,
    };
    const manager = fakeManager(pubkey, { type: 'nip46', payload });
    jest.mocked(getNostrRuntime).mockReturnValue({ manager, status: 'ready' });

    await expect(connectNip46Signer(payload)).resolves.toEqual({ pubkey, signer: 'nip46' });
    expect(manager.setSigner).toHaveBeenCalledWith('nip46', payload);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(JSON.stringify(jest.mocked(SecureStore.setItemAsync).mock.calls)).not.toContain('nsec1');
  });

  it('rejects malformed secret input before touching a signer or storage', async () => {
    const manager = fakeManager('a'.repeat(64));
    jest.mocked(getNostrRuntime).mockReturnValue({ manager, status: 'ready' });

    await expect(importNostrSecret('not-a-secret')).rejects.toThrow(/nsec1/);
    expect(manager.setSigner).not.toHaveBeenCalled();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});

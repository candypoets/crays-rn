/* eslint-disable import/first */
jest.mock('expo-crypto', () => ({ getRandomBytesAsync: jest.fn() }));

import * as Crypto from 'expo-crypto';
import { getPublicKey } from 'nostr-tools';

import {
  CRAYS_NIP46_PERMISSIONS,
  createBunkerConnection,
  createNostrConnectRequest,
  normalizeNip46Relays,
} from '@/account/nostrConnect';

const clientKey = Uint8Array.from([...new Array(31).fill(0), 1]);
const challenge = Uint8Array.from([...new Array(31).fill(0), 2]);
const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

describe('Nostr Connect request construction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(Crypto.getRandomBytesAsync)
      .mockResolvedValueOnce(clientKey)
      .mockResolvedValueOnce(challenge);
  });

  it('builds a NIP-46 request without logging or returning the user secret key', async () => {
    const request = await createNostrConnectRequest('Crays', ['wss://relay.example', 'https://invalid.example']);
    const parsed = new URL(request.url);
    expect(parsed.protocol).toBe('nostrconnect:');
    expect(parsed.hostname).toBe(getPublicKey(clientKey));
    expect(parsed.searchParams.getAll('relay')).toEqual(['wss://relay.example']);
    expect(parsed.searchParams.get('name')).toBe('Crays');
    expect(parsed.searchParams.get('perms')).toBe(CRAYS_NIP46_PERMISSIONS.join(','));
    expect(parsed.searchParams.get('secret')).toBe(hex(challenge));
    expect(request.clientSecret).toBe(hex(clientKey));
    expect(request).not.toHaveProperty('nsec');
  });

  it('normalizes relay transport and rejects an invalid bunker URL', async () => {
    expect(normalizeNip46Relays([' wss://one.example ', 'wss://one.example', 'ws://two.example', 'https://bad.example']))
      .toEqual(['wss://one.example', 'ws://two.example']);
    await expect(createBunkerConnection('https://not-a-bunker.example')).rejects.toThrow(/bunker:\/\//);
  });

  it('pairs a valid bunker URL with a fresh client key', async () => {
    const bunker = `bunker://${'a'.repeat(64)}?relay=${encodeURIComponent('wss://relay.example')}`;
    const result = await createBunkerConnection(bunker);
    expect(result).toEqual({ clientSecret: hex(clientKey), url: bunker });
  });
});

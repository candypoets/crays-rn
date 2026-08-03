/* eslint-disable import/first -- Jest mocks must be declared before imports. */
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
import * as SecureStore from 'expo-secure-store';
import { loadMessageRelays, saveMessageRelays } from '@/messages/relays';

describe('durable direct-message relays', () => {
  beforeEach(() => { jest.resetAllMocks(); jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null); });
  it('stores unique WebSocket relays for the active identity', async () => {
    await saveMessageRelays('a'.repeat(64), ['ws://room', 'https://bad', 'ws://room', 'wss://other']);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('crays.messages.relays.v1', JSON.stringify({ pubkey: 'a'.repeat(64), relays: ['ws://room', 'wss://other'] }));
  });
  it('does not expose another identity or malformed storage', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(JSON.stringify({ pubkey: 'a'.repeat(64), relays: ['ws://room'] }));
    await expect(loadMessageRelays('b'.repeat(64))).resolves.toEqual([]);
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('{bad');
    await expect(loadMessageRelays('a'.repeat(64))).resolves.toEqual([]);
  });
});

/* eslint-disable import/first -- Jest mocks must be declared before imports. */
const mockValues = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockValues.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockValues.set(key, value); }),
}));

import * as SecureStore from 'expo-secure-store';
import { findTicket, listTickets, saveConfirmedRsvp } from '@/access/tickets';

const event = { id: 'e'.repeat(64), address: `31923:${'a'.repeat(64)}:jazz`, title: 'Rooftop Jazz', summary: 'Live set', location: 'Roof', start: 2_000_000_000, end: null, capacity: 80, price: 0, currency: 'EUR' };

describe('durable tickets', () => {
  beforeEach(() => { jest.clearAllMocks(); mockValues.clear(); });

  it('stores one relay-confirmed RSVP per event address', async () => {
    await saveConfirmedRsvp({ event, relayUrl: 'wss://room.test', roomId: 'skyline', roomName: 'Skyline' });
    await saveConfirmedRsvp({ event, relayUrl: 'wss://room.test', roomId: 'skyline', roomName: 'Skyline' });
    expect(await listTickets()).toHaveLength(1);
    expect(await findTicket(event.address)).toMatchObject({ title: 'Rooftop Jazz', status: 'going' });
  });

  it('does not surface malformed protected state', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('{bad');
    expect(await listTickets()).toEqual([]);
  });
});

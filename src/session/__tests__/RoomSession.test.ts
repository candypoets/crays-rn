import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createElement, type PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import { parseStoredRoom, RoomSessionProvider, useRoomSession } from '@/session/RoomSession';
import type { RoomDescriptor } from '@/rooms/types';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

const descriptor: RoomDescriptor & { joinedAt: number; visibility: 'visible' } = {
  id: 'skyline',
  name: 'The Skyline Room',
  about: 'Rooftop jazz',
  relayUrl: 'wss://room.test',
  address: `30312:${'a'.repeat(64)}:skyline`,
  communityAddress: `31727:${'b'.repeat(64)}:community`,
  rootPubkey: 'b'.repeat(64),
  operatorPubkey: 'a'.repeat(64),
  serviceUrl: 'https://room.test',
  capabilities: ['social'],
  status: 'open',
  open: true,
  verified: true,
  joinedAt: 1_000,
  visibility: 'visible',
};

describe('active room persistence boundary', () => {
  it('fills safe presence defaults for a valid NIP-53 room session', () => {
    const result = parseStoredRoom(JSON.stringify(descriptor), 2_000);
    expect(result.room).toEqual(expect.objectContaining({
      intent: 'curious',
      context: '',
      leaveAt: 1_000 + 2 * 60 * 60 * 1000,
    }));
  });

  it('rejects an expired automatic-leave session and preserves its name for Room ended', () => {
    const result = parseStoredRoom(JSON.stringify({ ...descriptor, leaveAt: 1_500 }), 2_000);
    expect(result).toEqual({ room: null, expiredName: 'The Skyline Room' });
  });

  it('rejects corrupt or structurally unsafe session state', () => {
    expect(parseStoredRoom('{', 2_000)).toEqual({ room: null });
    expect(parseStoredRoom(JSON.stringify({ ...descriptor, relayUrl: null }), 2_000)).toEqual({ room: null });
  });
});

describe('automatic room expiry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-02T20:00:00Z'));
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
    jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);
  });
  afterEach(() => jest.useRealTimers());

  it('clears the durable session and exposes the automatic ended reason at the selected deadline', async () => {
    const wrapper = ({ children }: PropsWithChildren) => createElement(RoomSessionProvider, null, children);
    const { result } = renderHook(() => useRoomSession(), { wrapper });
    await act(async () => { await Promise.resolve(); });
    await act(async () => {
      await result.current.enterRoom(
        { ...descriptor, capabilities: ['social'] as const },
        { visibility: 'quiet', intent: 'curious', context: '', leaveAfterMinutes: 60 },
      );
    });
    expect(result.current.activeRoom?.name).toBe('The Skyline Room');
    await act(async () => { jest.advanceTimersByTime(60 * 60 * 1000); await Promise.resolve(); });
    await waitFor(() => expect(result.current.activeRoom).toBeNull());
    expect(result.current.endedRoom).toEqual({ name: 'The Skyline Room', reason: 'automatic' });
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('crays.room.active.v2');
  });
});

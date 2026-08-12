import * as SecureStore from 'expo-secure-store';
import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { ActiveRoom, RoomDescriptor, RoomJoinPreferences } from '@/rooms/types';

// v2 rejects sessions created from the retired app-data room selector.
const STORAGE_KEY = 'crays.room.active.v2';

type RoomSessionValue = {
  activeRoom: ActiveRoom | null;
  endedRoom: { name: string; reason: 'automatic' | 'explicit' | 'switch' } | null;
  hydrated: boolean;
  enterRoom: (room: RoomDescriptor, preferences: RoomJoinPreferences, connectionRelayUrl?: string) => Promise<void>;
  leaveRoom: (reason?: 'explicit' | 'switch') => Promise<void>;
};

const RoomSessionContext = createContext<RoomSessionValue | null>(null);

export function parseStoredRoom(value: string | null, now = Date.now()): { room: ActiveRoom | null; expiredName?: string } {
  if (!value) return { room: null };
  try {
    const room = JSON.parse(value) as ActiveRoom;
    if (
      typeof room.id === 'string' &&
      /^30312:[0-9a-f]{64}:.+$/i.test(room.address) &&
      /^31727:[0-9a-f]{64}:community$/i.test(room.communityAddress) &&
      /^[0-9a-f]{64}$/i.test(room.rootPubkey) &&
      typeof room.relayUrl === 'string' &&
      typeof room.operatorPubkey === 'string' &&
      typeof room.serviceUrl === 'string' &&
      ['open', 'private', 'closed'].includes(room.status) &&
      (room.visibility === 'quiet' || room.visibility === 'visible')
    ) {
      const joinedAt = Number.isSafeInteger(room.joinedAt) ? room.joinedAt : now;
      const leaveAt = Number.isSafeInteger(room.leaveAt) ? room.leaveAt : joinedAt + 2 * 60 * 60 * 1000;
      if (leaveAt <= now) return { room: null, expiredName: room.name };
      return { room: {
        ...room,
        joinedAt,
        leaveAt,
        intent: ['social', 'business', 'dating', 'curious'].includes(room.intent) ? room.intent : 'curious',
        context: typeof room.context === 'string' ? room.context.slice(0, 80) : '',
      } };
    }
  } catch {
    // Corrupt local navigation state is discarded; relay data remains truth.
  }
  return { room: null };
}

export async function getStoredActiveRoom(): Promise<ActiveRoom | null> {
  const value = await SecureStore.getItemAsync(STORAGE_KEY);
  return parseStoredRoom(value).room;
}

export function RoomSessionProvider({ children }: PropsWithChildren) {
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [endedRoom, setEndedRoom] = useState<RoomSessionValue['endedRoom']>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then(async (value) => {
        const { room, expiredName } = parseStoredRoom(value);
        if (!room && value) await SecureStore.deleteItemAsync(STORAGE_KEY);
        if (expiredName) setEndedRoom({ name: expiredName, reason: 'automatic' });
        setActiveRoom(room);
      })
      .finally(() => setHydrated(true));
  }, []);

  const enterRoom = useCallback(async (room: RoomDescriptor, preferences: RoomJoinPreferences, connectionRelayUrl?: string) => {
    const joinedAt = Date.now();
    const next: ActiveRoom = { ...room, ...preferences, context: preferences.context.trim().slice(0, 80), joinedAt, leaveAt: joinedAt + preferences.leaveAfterMinutes * 60 * 1000, connectionRelayUrl };
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    setEndedRoom(null);
    setActiveRoom(next);
  }, []);

  const leaveRoom = useCallback(async (reason: 'explicit' | 'switch' = 'explicit') => {
    if (activeRoom) setEndedRoom({ name: activeRoom.name, reason });
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    setActiveRoom(null);
  }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;
    const remaining = activeRoom.leaveAt - Date.now();
    const timer = setTimeout(() => {
      void SecureStore.deleteItemAsync(STORAGE_KEY);
      setEndedRoom({ name: activeRoom.name, reason: 'automatic' });
      setActiveRoom(null);
    }, Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [activeRoom]);

  const value = useMemo(() => ({ activeRoom, endedRoom, hydrated, enterRoom, leaveRoom }), [activeRoom, endedRoom, enterRoom, hydrated, leaveRoom]);
  return <RoomSessionContext.Provider value={value}>{children}</RoomSessionContext.Provider>;
}

export function useRoomSession(): RoomSessionValue {
  const value = useContext(RoomSessionContext);
  if (!value) throw new Error('useRoomSession must be used inside RoomSessionProvider');
  return value;
}

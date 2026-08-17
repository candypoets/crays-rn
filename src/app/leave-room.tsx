import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { leaveTemplate } from '@/nostr/protocol';
import { relayUrlFor } from '@/rooms/relayUrl';
import { LeaveRoomScreen } from '@/screens/room/LeaveAndSwitchScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function LeaveRoomRoute() {
  const { activeRoom, hydrated, leaveRoom } = useRoomSession();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopPublishRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopPublishRef.current?.(), []);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;

  const finishLeave = async () => {
    const name = activeRoom.name;
    try {
      await leaveRoom();
      router.replace({ pathname: '/room-ended', params: { name } } as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This room could not be removed from this device.');
      setLeaving(false);
    }
  };

  const leave = () => {
    if (leaving) return;
    setLeaving(true);
    setError(null);
    if (activeRoom.visibility !== 'visible') {
      void finishLeave();
      return;
    }

    let settled = false;
    let stop: () => void = () => undefined;
    const cancel = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      stop();
      stopPublishRef.current = null;
    };
    const finish = (failure?: string) => {
      if (settled) return;
      cancel();
      if (failure) {
        setError(failure);
        setLeaving(false);
      } else {
        void finishLeave();
      }
    };
    const timeout = setTimeout(
      () => finish('The room did not confirm this action. Check the connection and try again.'),
      12_000,
    );
    try {
      stop = publishToNostr(
        `leave_room_${Date.now().toString(36)}`,
        leaveTemplate({
          roomAddress: activeRoom.address,
          relayUrl: activeRoom.relayUrl,
          expiresAt: Math.max(Math.floor(activeRoom.leaveAt / 1000), Math.floor(Date.now() / 1000) + 60),
        }),
        (message: WorkerMessage) => {
          const status = isConnectionStatus(message);
          const value = status?.status()?.toString().toLowerCase() ?? '';
          if (value === 'ok' || value === 'true' || value.startsWith('true ')) finish();
          else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) {
            finish(status?.message()?.trim() || 'The room rejected this action.');
          }
        },
        { trackStatus: true, defaultRelays: [relayUrlFor(activeRoom)] },
      );
      stopPublishRef.current = cancel;
    } catch (cause) {
      clearTimeout(timeout);
      stop();
      stopPublishRef.current = null;
      setError(cause instanceof Error ? cause.message : 'The room could not start this action.');
      setLeaving(false);
    }
  };

  return <LeaveRoomScreen error={error} leaving={leaving} onCancel={() => router.back()} onLeave={leave} room={activeRoom} />;
}

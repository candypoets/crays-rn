import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { leaveTemplate } from '@/nostr/protocol';
import { relayUrlFor } from '@/rooms/relayUrl';
import { useRoomDefinition } from '@/rooms/useRoomDefinition';
import { SwitchRoomScreen } from '@/screens/room/LeaveAndSwitchScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function SwitchRoomRoute() {
  const params = useLocalSearchParams<{ invite?: string; relay?: string; room?: string; service?: string; token?: string }>();
  const { activeRoom, hydrated, leaveRoom } = useRoomSession();
  const definition = useRoomDefinition(params.relay, params.room);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopPublishRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopPublishRef.current?.(), []);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href={{ pathname: '/room-preview', params } as never} />;

  const finishSwitch = async () => {
    try {
      await leaveRoom('switch');
      router.replace({ pathname: '/join-room', params } as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The current room could not be removed from this device.');
      setSwitching(false);
    }
  };

  const switchRoom = () => {
    if (!definition.room || switching) return;
    setSwitching(true);
    setError(null);
    if (activeRoom.visibility !== 'visible') {
      void finishSwitch();
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
        setSwitching(false);
      } else {
        void finishSwitch();
      }
    };
    const timeout = setTimeout(
      () => finish('The current room did not confirm the switch. Check the connection and try again.'),
      12_000,
    );
    try {
      stop = publishToNostr(
        `switch_leave_${Date.now().toString(36)}`,
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
            finish(status?.message()?.trim() || 'The current room rejected the switch.');
          }
        },
        { trackStatus: true, defaultRelays: [relayUrlFor(activeRoom)] },
      );
      stopPublishRef.current = cancel;
    } catch (cause) {
      clearTimeout(timeout);
      stop();
      stopPublishRef.current = null;
      setError(cause instanceof Error ? cause.message : 'The room switch could not be started.');
      setSwitching(false);
    }
  };

  return <SwitchRoomScreen current={activeRoom} destination={definition.room} error={error || definition.error} loading={definition.loading} onCancel={() => router.back()} onSwitch={switchRoom} switching={switching} />;
}

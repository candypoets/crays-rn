import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { leaveTemplate } from '@/nostr/protocol';
import { publishEvent } from '@/nostr/publish';
import { relayUrlFor } from '@/rooms/relayUrl';
import { LeaveRoomScreen } from '@/screens/room/LeaveAndSwitchScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function LeaveRoomRoute() {
  const { activeRoom, hydrated, leaveRoom } = useRoomSession();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;

  const leave = async () => {
    if (leaving) return;
    setLeaving(true);
    setError(null);
    try {
      if (activeRoom.visibility === 'visible') {
        const transportRelayUrl = relayUrlFor(activeRoom);
        await publishEvent(
          leaveTemplate({
            roomAddress: activeRoom.address,
            relayUrl: activeRoom.relayUrl,
            expiresAt: Math.max(Math.floor(activeRoom.leaveAt / 1000), Math.floor(Date.now() / 1000) + 60),
          }),
          [transportRelayUrl],
          'leave_room',
        );
      }
      const name = activeRoom.name;
      await leaveRoom();
      router.replace({ pathname: '/room-ended', params: { name } } as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The room did not confirm that your presence ended.');
    } finally {
      setLeaving(false);
    }
  };

  return <LeaveRoomScreen error={error} leaving={leaving} onCancel={() => router.back()} onLeave={leave} room={activeRoom} />;
}

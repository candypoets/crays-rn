import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ensureLocalIdentity } from '@/account/account';
import { leaveTemplate } from '@/nostr/protocol';
import { publishEvent } from '@/nostr/publish';
import { relayUrlFor } from '@/rooms/relayUrl';
import { fetchRelayRootPubkey } from '@/rooms/trust';
import { useRoomManifest } from '@/rooms/useRoomManifest';
import { SwitchRoomScreen } from '@/screens/room/LeaveAndSwitchScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function SwitchRoomRoute() {
  const params = useLocalSearchParams<{ invite?: string; relay?: string; room?: string; service?: string; token?: string }>();
  const { activeRoom, hydrated, leaveRoom } = useRoomSession();
  const manifest = useRoomManifest(params.relay, params.room);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href={{ pathname: '/room-preview', params } as never} />;

  const switchRoom = async () => {
    if (!manifest.room || switching) return;
    setSwitching(true);
    setError(null);
    try {
      if (activeRoom.visibility === 'visible') {
        const transportRelayUrl = relayUrlFor(activeRoom);
        const [, communityRootPubkey] = await Promise.all([
          ensureLocalIdentity(),
          fetchRelayRootPubkey(transportRelayUrl),
        ]);
        await publishEvent(
          leaveTemplate({
            communityRootPubkey,
            relayUrl: activeRoom.relayUrl,
            expiresAt: Math.max(Math.floor(activeRoom.leaveAt / 1000), Math.floor(Date.now() / 1000) + 60),
          }),
          [transportRelayUrl],
          'switch_leave',
        );
      }
      await leaveRoom('switch');
      router.replace({ pathname: '/join-room', params } as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The current room did not confirm the switch.');
    } finally {
      setSwitching(false);
    }
  };

  return <SwitchRoomScreen current={activeRoom} destination={manifest.room} error={error || manifest.error} loading={manifest.loading} onCancel={() => router.back()} onSwitch={switchRoom} switching={switching} />;
}

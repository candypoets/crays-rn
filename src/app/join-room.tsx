import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ensureLocalIdentity, getLocalProfileTemplate } from '@/account/account';
import { presenceTemplate } from '@/nostr/protocol';
import { publishEvent } from '@/nostr/publish';
import { useRoomManifest } from '@/rooms/useRoomManifest';
import type { RoomJoinPreferences } from '@/rooms/types';
import { JoinPrivacyScreen } from '@/screens/discovery/JoinPrivacyScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function JoinRoomRoute() {
  const params = useLocalSearchParams<{ relay?: string; room?: string }>();
  const manifest = useRoomManifest(params.relay, params.room);
  const { enterRoom } = useRoomSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enter = async (preferences: RoomJoinPreferences) => {
    if (!manifest.room || loading) return;
    setLoading(true);
    setError(null);
    try {
      if (preferences.visibility === 'visible') {
        const [identity, profile] = await Promise.all([ensureLocalIdentity(), getLocalProfileTemplate()]);
        if (!profile) throw new Error('Finish account setup before joining visibly. You can still browse quietly.');
        const relayUrl = params.relay || manifest.room.relayUrl;
        await publishEvent(profile, [relayUrl], 'room_profile');
        await publishEvent(
          presenceTemplate({
            roomId: manifest.room.id,
            pubkey: identity.pubkey,
            visibility: 'visible',
            intent: preferences.intent,
            context: preferences.context,
            expiresAt: Math.floor(Date.now() / 1000) + preferences.leaveAfterMinutes * 60,
          }),
          [relayUrl],
          'room_presence',
        );
      }
      await enterRoom(manifest.room, preferences, params.relay);
      router.replace('/room' as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The room could not be joined.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <JoinPrivacyScreen
      error={error || manifest.error}
      loading={loading || manifest.loading}
      onBack={() => router.back()}
      onEnter={enter}
      roomName={manifest.room?.name || 'this room'}
    />
  );
}

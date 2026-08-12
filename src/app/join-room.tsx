import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ensureLocalIdentity, getLocalProfileTemplate } from '@/account/account';
import { grantVisibleRoomAccess, inviteSourceForVisibility } from '@/invites/roomAccess';
import { presenceTemplate } from '@/nostr/protocol';
import { publishEvent, publishEventAfterAccess } from '@/nostr/publish';
import { useRoomDefinition } from '@/rooms/useRoomDefinition';
import type { RoomJoinPreferences } from '@/rooms/types';
import { JoinPrivacyScreen } from '@/screens/discovery/JoinPrivacyScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function JoinRoomRoute() {
  const params = useLocalSearchParams<{ invite?: string; relay?: string; room?: string; service?: string; token?: string }>();
  const definition = useRoomDefinition(params.relay, params.room);
  const { enterRoom } = useRoomSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enter = async (preferences: RoomJoinPreferences) => {
    if (!definition.room || loading) return;
    setLoading(true);
    setError(null);
    try {
      if (preferences.visibility === 'visible') {
        const [identity, profile] = await Promise.all([ensureLocalIdentity(), getLocalProfileTemplate()]);
        if (!profile) throw new Error('Finish account setup before joining visibly. You can still browse quietly.');
        let confirmedInviteAccess = false;
        const inviteSource = inviteSourceForVisibility(preferences.visibility, {
          handoffUrl: params.invite,
          serviceUrl: params.service,
          token: params.token,
        });
        if (inviteSource) {
          const redemption = await grantVisibleRoomAccess({
            source: inviteSource,
            pubkey: identity.pubkey,
            roomRelayUrl: definition.room.relayUrl,
          });
          confirmedInviteAccess = Boolean(redemption);
          if (redemption && __DEV__) console.info(`[crays-room-access-granted]${JSON.stringify({ eventId: redemption.eventId, roomId: definition.room.id })}`);
        }
        const relayUrl = params.relay || definition.room.relayUrl;
        const publishVisible = confirmedInviteAccess ? publishEventAfterAccess : publishEvent;
        await publishVisible(profile, [relayUrl], 'room_profile');
        await publishVisible(
          presenceTemplate({
            roomAddress: definition.room.address,
            relayUrl: definition.room.relayUrl,
            intent: preferences.intent,
            context: preferences.context,
            expiresAt: Math.floor(Date.now() / 1000) + preferences.leaveAfterMinutes * 60,
          }),
          [relayUrl],
          'room_presence',
        );
      }
      await enterRoom(definition.room, preferences, params.relay);
      router.replace('/room' as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The room could not be joined.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <JoinPrivacyScreen
      error={error || definition.error}
      loading={loading || definition.loading}
      onBack={() => router.back()}
      onEnter={enter}
      roomName={definition.room?.name || 'this room'}
    />
  );
}

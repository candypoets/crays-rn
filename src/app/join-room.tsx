import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { EventTemplate } from 'nostr-tools';

import { getLocalProfileTemplate, getLocalPubkey } from '@/account/account';
import { grantVisibleRoomAccess, inviteSourceForVisibility } from '@/invites/roomAccess';
import { presenceTemplate } from '@/nostr/protocol';
import { useRoomDefinition } from '@/rooms/useRoomDefinition';
import type { RoomJoinPreferences } from '@/rooms/types';
import { JoinPrivacyScreen } from '@/screens/discovery/JoinPrivacyScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function JoinRoomRoute() {
  const params = useLocalSearchParams<{ invite?: string; mode?: string; relay?: string; room?: string; service?: string; token?: string }>();
  const definition = useRoomDefinition(params.relay, params.room);
  const { activeRoom, enterRoom, updatePresence } = useRoomSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopPublishRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopPublishRef.current?.(), []);

  const startPublish = ({
    allowAccessRetry,
    onSuccess,
    operation,
    relayUrl,
    template,
  }: {
    allowAccessRetry: boolean;
    onSuccess: () => void;
    operation: string;
    relayUrl: string;
    template: EventTemplate;
  }) => {
    const retryDelays = allowAccessRetry ? [400, 800, 1_200, 1_600] : [];
    let attempt = 0;
    let cancelled = false;
    let stop: () => void = () => undefined;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      if (timeout) clearTimeout(timeout);
      if (retryTimer) clearTimeout(retryTimer);
      stop();
      stopPublishRef.current = null;
    };
    const fail = (failure: string) => {
      if (cancelled) return;
      cancel();
      setError(failure);
      setLoading(false);
    };
    const publishAttempt = () => {
      if (cancelled) return;
      stop();
      timeout = setTimeout(() => fail('The room did not confirm access. Check the connection and try again.'), 12_000);
      try {
        stop = publishToNostr(
          `${operation}_${Date.now().toString(36)}_${attempt}`,
          template,
          (message: WorkerMessage) => {
            const status = isConnectionStatus(message);
            const value = status?.status()?.toString().toLowerCase() ?? '';
            if (value === 'ok' || value === 'true' || value.startsWith('true ')) {
              if (timeout) clearTimeout(timeout);
              stop();
              stopPublishRef.current = null;
              cancelled = true;
              onSuccess();
            } else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) {
              if (timeout) clearTimeout(timeout);
              stop();
              const delay = retryDelays[attempt];
              if (delay !== undefined) {
                attempt += 1;
                retryTimer = setTimeout(publishAttempt, delay);
              } else {
                fail(status?.message()?.trim() || 'The room rejected this action. Your account may not have access here.');
              }
            }
          },
          { trackStatus: true, defaultRelays: [relayUrl] },
        );
        stopPublishRef.current = cancel;
      } catch (cause) {
        fail(cause instanceof Error ? cause.message : 'The room action could not be started.');
      }
    };
    publishAttempt();
  };

  const enter = async (preferences: RoomJoinPreferences) => {
    if (!definition.room || loading) return;
    setLoading(true);
    setError(null);
    try {
      if (preferences.visibility === 'visible') {
        const [pubkey, profile] = await Promise.all([getLocalPubkey(), getLocalProfileTemplate()]);
        if (!pubkey) throw new Error('No Nostr account is available on this device. Log in or create one first.');
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
            pubkey,
            roomRelayUrl: definition.room.relayUrl,
          });
          confirmedInviteAccess = Boolean(redemption);
          if (redemption && __DEV__) console.info(`[crays-room-access-granted]${JSON.stringify({ eventId: redemption.eventId, roomId: definition.room.id })}`);
        }
        const relayUrl = params.relay || definition.room.relayUrl;
        const expiresAt = Math.floor(Date.now() / 1000) + preferences.leaveAfterMinutes * 60;
        const leaveAt = expiresAt * 1000;
        const presence = presenceTemplate({
          roomAddress: definition.room.address,
          relayUrl: definition.room.relayUrl,
          intent: preferences.intent,
          context: preferences.context,
          expiresAt,
        });
        startPublish({
          allowAccessRetry: confirmedInviteAccess,
          operation: 'room_profile',
          relayUrl,
          template: profile,
          onSuccess: () => startPublish({
            allowAccessRetry: confirmedInviteAccess,
            operation: 'room_presence',
            relayUrl,
            template: presence,
            onSuccess: () => {
              const save = activeRoom?.id === definition.room!.id
                ? updatePresence(preferences, leaveAt)
                : enterRoom(definition.room!, preferences, params.relay, leaveAt);
              void save
                .then(() => router.replace('/room' as never))
                .catch((cause) => {
                  setError(cause instanceof Error ? cause.message : 'The room could not be saved on this device.');
                  setLoading(false);
                });
            },
          }),
        });
        return;
      }
      if (activeRoom?.id === definition.room.id) await updatePresence(preferences);
      else await enterRoom(definition.room, preferences, params.relay);
      router.replace('/room' as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The room could not be joined.');
      setLoading(false);
    }
  };
  return (
    <JoinPrivacyScreen
      error={error || definition.error}
      loading={loading || definition.loading}
      onBack={() => router.back()}
      onEnter={enter}
      roomAbout={definition.room?.about}
      roomName={definition.room?.name || 'this room'}
      visibilityOnly={params.mode === 'visibility'}
    />
  );
}

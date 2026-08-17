import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { uploadRoomImage, type LocalRoomImage } from '@/media/blossom';
import { roomFeedTemplate, roomReplyTemplate, type RoomPostMedia } from '@/nostr/protocol';
import { canContinueRoomPostOperation } from '@/rooms/feed';
import { relayUrlFor } from '@/rooms/relayUrl';
import { useRoomData } from '@/rooms/RoomData';
import { RoomPostScreen, type RoomPostPhase } from '@/screens/room/RoomPostScreen';
import { useRoomSession } from '@/session/RoomSession';

async function uploadAttachments(images: readonly LocalRoomImage[]): Promise<RoomPostMedia[]> {
  const media: RoomPostMedia[] = [];
  for (const image of images) media.push(await uploadRoomImage(image));
  return media;
}

const nowMilliseconds = () => Date.now();

export default function RoomPostRoute() {
  const { replyTo = '' } = useLocalSearchParams<{ replyTo?: string }>();
  const { activeRoom, hydrated } = useRoomSession();
  const data = useRoomData();
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<LocalRoomImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<RoomPostPhase>('idle');
  const stopPublishRef = useRef<(() => void) | null>(null);
  const operationRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
    operationRef.current += 1;
    stopPublishRef.current?.();
  }, []);

  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  const parent = replyTo ? data.posts.find((post) => post.id === replyTo) : undefined;
  const replyTargetMissing = Boolean(replyTo && !parent && !data.loading);
  const relayUrl = relayUrlFor(activeRoom);

  const addImages = async () => {
    if (phase !== 'idle' || attachments.length >= 4) return;
    setPhase('selecting');
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo access is off. Allow access in system settings, then try Add photos again.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images'],
        quality: 0.92,
        selectionLimit: 4 - attachments.length,
      });
      if (result.canceled) return;
      setAttachments((current) => {
        const seen = new Set(current.map((image) => image.uri));
        const selected = result.assets
          .filter((asset) => asset.uri && !seen.has(asset.uri))
          .map((asset) => ({
            uri: asset.uri,
            width: Math.max(1, Math.round(asset.width || 1)),
            height: Math.max(1, Math.round(asset.height || 1)),
            mimeType: asset.mimeType,
            fileName: asset.fileName,
          }));
        return [...current, ...selected].slice(0, 4);
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Photos could not be opened. Try again.');
    } finally {
      setPhase('idle');
    }
  };

  const publish = () => {
    const content = draft.trim();
    if (phase !== 'idle' || (!content && !attachments.length) || replyTargetMissing) return;
    if (activeRoom.leaveAt <= nowMilliseconds()) {
      setError('Your room session ended before this post was sent. Rejoin the room to publish it.');
      return;
    }
    setError(null);
    const operationId = operationRef.current + 1;
    operationRef.current = operationId;
    const startPublish = (media: RoomPostMedia[]) => {
      const operationCurrent = canContinueRoomPostOperation({
        currentOperationId: operationRef.current,
        leaveAt: activeRoom.leaveAt,
        mounted: mountedRef.current,
        now: nowMilliseconds(),
        operationId,
      });
      if (!operationCurrent) {
        if (!mountedRef.current || operationRef.current !== operationId) return;
        setError('Your room session ended while the photos were uploading. Rejoin the room to publish this draft.');
        setPhase('idle');
        return;
      }
      setPhase('publishing');
      const template = parent
        ? roomReplyTemplate({
            roomId: activeRoom.id,
            relayUrl,
            content,
            expiresAt: Math.floor(activeRoom.leaveAt / 1000),
            parent: {
              id: parent.id,
              pubkey: parent.pubkey,
              participantPubkeys: parent.participantPubkeys,
              rootId: parent.rootId,
              rootPubkey: parent.rootPubkey,
            },
            media,
          })
        : roomFeedTemplate(activeRoom.id, content, Math.floor(activeRoom.leaveAt / 1000), media);
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
          setPhase('idle');
        } else router.back();
      };
      const timeout = setTimeout(() => finish('The room did not confirm this post. Your draft is still here; check the connection and try again.'), 12_000);
      try {
        stop = publishToNostr(
          `room_post_${nowMilliseconds().toString(36)}`,
          template,
          (message: WorkerMessage) => {
            const status = isConnectionStatus(message);
            const value = status?.status()?.toString().toLowerCase() ?? '';
            if (value === 'ok' || value === 'true' || value.startsWith('true ')) finish();
            else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) finish(status?.message()?.trim() || 'The room rejected this post. Your draft is still here.');
          },
          { trackStatus: true, defaultRelays: [relayUrl] },
        );
        stopPublishRef.current = cancel;
      } catch (cause) {
        clearTimeout(timeout);
        stop();
        setError(cause instanceof Error ? cause.message : 'The post could not be sent. Your draft is still here.');
        setPhase('idle');
      }
    };
    if (!attachments.length) {
      startPublish([]);
      return;
    }
    setPhase('uploading');
    void uploadAttachments(attachments).then(startPublish).catch((cause) => {
      if (!canContinueRoomPostOperation({ currentOperationId: operationRef.current, leaveAt: activeRoom.leaveAt, mounted: mountedRef.current, now: nowMilliseconds(), operationId })) return;
      setError(cause instanceof Error ? cause.message : 'The post could not be sent. Your draft is still here.');
      setPhase('idle');
    });
  };

  return (
    <RoomPostScreen
      activeRoom={activeRoom}
      attachments={attachments}
      draft={draft}
      error={error}
      onAddImages={addImages}
      onChangeDraft={(value) => { setDraft(value); setError(null); }}
      onClose={() => router.back()}
      onPublish={publish}
      onRemoveImage={(uri) => setAttachments((current) => current.filter((image) => image.uri !== uri))}
      parent={parent}
      parentProfile={parent ? data.profiles.get(parent.pubkey) : undefined}
      phase={phase}
      replyTargetMissing={replyTargetMissing}
    />
  );
}

import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { EventTemplate } from 'nostr-tools';

import { roomReactionTemplate, venueReportTemplate } from '@/nostr/protocol';
import { buildRoomThread } from '@/rooms/feed';
import { relayUrlFor } from '@/rooms/relayUrl';
import { useRoomData } from '@/rooms/RoomData';
import type { RoomPost } from '@/rooms/types';
import { RoomThreadScreen } from '@/screens/room/RoomThreadScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function RoomThreadRoute() {
  const { id = '', liked = '' } = useLocalSearchParams<{ id?: string; liked?: string }>();
  const { activeRoom, hydrated } = useRoomSession();
  const data = useRoomData();
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => new Set(liked.split(',').filter(Boolean)));
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const stopLikeRef = useRef<(() => void) | null>(null);
  const stopReportRef = useRef<(() => void) | null>(null);
  useEffect(() => () => { stopLikeRef.current?.(); stopReportRef.current?.(); }, []);

  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  const relayUrl = relayUrlFor(activeRoom);
  const thread = buildRoomThread(data.posts, id);

  const publishAction = ({
    actionId,
    template,
    pendingId,
    setPendingId,
    stopRef,
    failureMessage,
    onSuccess,
  }: {
    actionId: string;
    template: EventTemplate;
    pendingId: string | null;
    setPendingId: (value: string | null) => void;
    stopRef: MutableRefObject<(() => void) | null>;
    failureMessage: string;
    onSuccess: () => void;
  }) => {
    if (pendingId) return;
    setPendingId(actionId);
    setNotice(null);
    let settled = false;
    let stop: () => void = () => undefined;
    const cancel = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      stop();
      stopRef.current = null;
    };
    const finish = (failure?: string) => {
      if (settled) return;
      cancel();
      setPendingId(null);
      if (failure) setNotice(failure); else onSuccess();
    };
    const timeout = setTimeout(() => finish(failureMessage), 12_000);
    try {
      stop = publishToNostr(
        `${id}_${actionId}_${Date.now().toString(36)}`,
        template,
        (message: WorkerMessage) => {
          const status = isConnectionStatus(message);
          const value = status?.status()?.toString().toLowerCase() ?? '';
          if (value === 'ok' || value === 'true' || value.startsWith('true ')) finish();
          else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) finish(status?.message()?.trim() || failureMessage);
        },
        { trackStatus: true, defaultRelays: [relayUrl] },
      );
      stopRef.current = cancel;
    } catch (cause) {
      clearTimeout(timeout);
      stop();
      setPendingId(null);
      setNotice(cause instanceof Error ? cause.message : failureMessage);
    }
  };

  const like = (post: RoomPost) => {
    const relayAlreadyHasLike = data.reactions.some((reaction) => reaction.targetId === post.id && reaction.pubkey === data.viewerPubkey);
    if (likedPostIds.has(post.id) || relayAlreadyHasLike) return;
    publishAction({
      actionId: `like_${post.id}`,
      template: roomReactionTemplate({ roomId: activeRoom.id, relayUrl, targetId: post.id, targetPubkey: post.pubkey, expiresAt: Math.floor(activeRoom.leaveAt / 1000) }),
      pendingId: likingPostId,
      setPendingId: setLikingPostId,
      stopRef: stopLikeRef,
      failureMessage: 'The room did not confirm this like. Check the connection and try again.',
      onSuccess: () => setLikedPostIds((current) => new Set(current).add(post.id)),
    });
  };

  const report = (post: RoomPost) => publishAction({
    actionId: `report_${post.id}`,
    template: venueReportTemplate(post.pubkey, activeRoom.id, 'other', post.id),
    pendingId: reportingPostId,
    setPendingId: setReportingPostId,
    stopRef: stopReportRef,
    failureMessage: 'The venue did not confirm this report. Check the connection and try again.',
    onSuccess: () => setNotice('Report sent to this venue. The post remains visible unless you block its author.'),
  });

  return (
    <RoomThreadScreen
      likedPostIds={likedPostIds}
      likingPostId={likingPostId}
      loading={data.loading}
      notice={notice}
      onBack={() => router.dismissTo({
        pathname: '/room' as never,
        params: { liked: Array.from(likedPostIds).join(',') || undefined, view: 'feed' },
      })}
      onLike={like}
      onMessage={(post) => router.push({ pathname: '/person' as never, params: { pubkey: post.pubkey } })}
      onOpenPerson={(post) => router.push({ pathname: '/person' as never, params: { pubkey: post.pubkey } })}
      onReply={(post) => router.push({ pathname: '/room-post' as never, params: { replyTo: post.id } })}
      onReport={report}
      profiles={data.profiles}
      reactions={data.reactions}
      reportingPostId={reportingPostId}
      roomName={activeRoom.name}
      thread={thread}
      viewerPubkey={data.viewerPubkey}
    />
  );
}

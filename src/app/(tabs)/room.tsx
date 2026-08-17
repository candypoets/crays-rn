import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useCart } from '@/commerce/Cart';
import { roomReactionTemplate, venueReportTemplate } from '@/nostr/protocol';
import { relayUrlFor } from '@/rooms/relayUrl';
import { useRoomData } from '@/rooms/RoomData';
import { RoomScreen, type RoomView } from '@/screens/room/RoomScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function RoomRoute() {
  const params = useLocalSearchParams<{ liked?: string; view?: string }>();
  const { activeRoom, endedRoom, hydrated } = useRoomSession();
  const data = useRoomData();
  const { count: cartCount } = useCart();
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const stopLikePublishRef = useRef<(() => void) | null>(null);
  const stopReportPublishRef = useRef<(() => void) | null>(null);
  const view: RoomView = params.view === 'people' || params.view === 'feed' ? params.view : 'menu';
  const effectiveLikedPostIds = new Set([...likedPostIds, ...(params.liked || '').split(',').filter(Boolean)]);
  useEffect(() => () => {
    stopLikePublishRef.current?.();
    stopReportPublishRef.current?.();
  }, []);
  if (!hydrated) return null;
  if (!activeRoom) return endedRoom?.reason === 'automatic'
    ? <Redirect href={{ pathname: '/room-ended', params: { name: endedRoom.name, reason: 'automatic' } } as never} />
    : <Redirect href="/discover" />;

  const likePost = (post: (typeof data.posts)[number]) => {
    const relayAlreadyHasLike = data.reactions.some((reaction) => reaction.targetId === post.id && reaction.pubkey === data.viewerPubkey);
    if (likingPostId || effectiveLikedPostIds.has(post.id) || relayAlreadyHasLike) return;
    setLikingPostId(post.id);
    setReportNotice(null);
    let settled = false;
    let stop: () => void = () => undefined;
    const cancel = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      stop();
      stopLikePublishRef.current = null;
    };
    const finish = (failure?: string) => {
      if (settled) return;
      cancel();
      if (failure) setReportNotice(failure);
      else setLikedPostIds((current) => new Set(current).add(post.id));
      setLikingPostId(null);
    };
    const timeout = setTimeout(() => finish('The room did not confirm this like. Check the connection and try again.'), 12_000);
    try {
      stop = publishToNostr(
        `room_like_${post.id}_${Date.now().toString(36)}`,
        roomReactionTemplate({
          roomId: activeRoom.id,
          relayUrl: relayUrlFor(activeRoom),
          targetId: post.id,
          targetPubkey: post.pubkey,
          expiresAt: Math.floor(activeRoom.leaveAt / 1000),
        }),
        (message: WorkerMessage) => {
          const status = isConnectionStatus(message);
          const value = status?.status()?.toString().toLowerCase() ?? '';
          if (value === 'ok' || value === 'true' || value.startsWith('true ')) finish();
          else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) {
            finish(status?.message()?.trim() || 'The room rejected this like.');
          }
        },
        { trackStatus: true, defaultRelays: [relayUrlFor(activeRoom)] },
      );
      stopLikePublishRef.current = cancel;
    } catch (cause) {
      clearTimeout(timeout);
      stop();
      setReportNotice(cause instanceof Error ? cause.message : 'The like could not be sent.');
      setLikingPostId(null);
    }
  };

  const reportPost = (post: (typeof data.posts)[number]) => {
    if (reportingPostId) return;
    setReportingPostId(post.id); setReportNotice(null);
    let settled = false;
    let stop: () => void = () => undefined;
    const cancel = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      stop();
      stopReportPublishRef.current = null;
    };
    const finish = (failure?: string) => {
      if (settled) return;
      cancel();
      setReportNotice(failure || 'Report sent to this venue. The post remains visible unless you block its author.');
      setReportingPostId(null);
    };
    const timeout = setTimeout(() => finish('The venue did not confirm this report. Check the connection and try again.'), 12_000);
    try {
      stop = publishToNostr(
        `feed_report_${Date.now().toString(36)}`,
        venueReportTemplate(post.pubkey, activeRoom.id, 'other', post.id),
        (message: WorkerMessage) => {
          const status = isConnectionStatus(message);
          const value = status?.status()?.toString().toLowerCase() ?? '';
          if (value === 'ok' || value === 'true' || value.startsWith('true ')) finish();
          else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) {
            finish(status?.message()?.trim() || 'The venue rejected this report.');
          }
        },
        { trackStatus: true, defaultRelays: [relayUrlFor(activeRoom)] },
      );
      stopReportPublishRef.current = cancel;
    } catch (cause) {
      clearTimeout(timeout);
      stop();
      setReportNotice(cause instanceof Error ? cause.message : 'The venue could not start this report.');
      setReportingPostId(null);
    }
  };

  return (
    <RoomScreen
      activeRoom={activeRoom}
      cartCount={cartCount}
      connected={data.connected}
      loading={data.loading}
      onCart={() => router.push('/review-pay' as never)}
      onChangeView={(next) => router.setParams({ view: next === 'menu' ? undefined : next })}
      onComposePost={() => router.push('/room-post' as never)}
      onLikePost={likePost}
      onLeave={() => router.push('/leave-room' as never)}
      onMyNight={() => router.push('/my-night' as never)}
      onOpenPerson={(pubkey) => router.push({ pathname: '/person' as never, params: { pubkey } })}
      onOpenProduct={(product) => router.push({ pathname: '/item' as never, params: { id: product.id } })}
      onOpenThread={(post) => router.push({
        pathname: '/room-thread' as never,
        params: {
          id: post.rootId || post.id,
          liked: Array.from(new Set([...effectiveLikedPostIds, ...(likingPostId ? [likingPostId] : [])])).join(',') || undefined,
        },
      })}
      onReplyPost={(post) => router.push({ pathname: '/room-post' as never, params: { replyTo: post.id } })}
      onReportPost={reportPost}
      people={data.people}
      posts={data.posts}
      products={data.products}
      profiles={data.profiles}
      reactions={data.reactions}
      viewerPubkey={data.viewerPubkey}
      likedPostIds={effectiveLikedPostIds}
      likingPostId={likingPostId}
      reportingPostId={reportingPostId}
      reportNotice={reportNotice}
      view={view}
    />
  );
}

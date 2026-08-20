import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Share } from 'react-native';

import { useCart } from '@/commerce/Cart';
import { createTestRoomPointer, TEST_ROOM_BUILD } from '@/config/testRoom';
import { nearbyRoomEntryParams } from '@/discovery/blePointer';
import { roomMapSearchUrl } from '@/discovery/roomEntry';
import { useNearbyRoom } from '@/discovery/useNearbyRoom';
import { roomReactionTemplate, venueReportTemplate } from '@/nostr/protocol';
import { roomInviteContent } from '@/rooms/invite';
import { relayUrlFor } from '@/rooms/relayUrl';
import { useRoomData } from '@/rooms/RoomData';
import { useRoomDefinition } from '@/rooms/useRoomDefinition';
import type { ActiveRoom, RoomDescriptor } from '@/rooms/types';
import { DiscoverHandoffScreen } from '@/screens/DiscoverHandoffScreen';
import { selectActiveOrder } from '@/screens/durable/AccountWalletScreens';
import { RoomScreen, type RoomView } from '@/screens/room/RoomScreen';
import { RoomEndedScreen } from '@/screens/room/LeaveAndSwitchScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function RoomRoute() {
  const { acknowledgeEndedRoom, activeRoom, endedRoom, hydrated } = useRoomSession();
  if (!hydrated) return null;
  if (!activeRoom && endedRoom) {
    return (
      <RoomEndedScreen
        automatic={endedRoom.reason === 'automatic'}
        onDiscover={acknowledgeEndedRoom}
        onMessages={() => router.navigate('/messages' as never)}
        previousRoomName={endedRoom.name}
        underTabBar
      />
    );
  }
  if (!activeRoom) return <TonightFindRoute />;
  return <ActiveRoomRoute activeRoom={activeRoom} />;
}

function TonightFindRoute() {
  const params = useLocalSearchParams<{ relay?: string; room?: string; nearby?: string }>();
  const focused = useIsFocused();
  const nearby = useNearbyRoom(focused && params.nearby === '1' && !params.relay);
  const transportRelay = params.relay || nearby.pointer?.relayUrl;
  const roomId = params.room || nearby.pointer?.roomId;
  const result = useRoomDefinition(transportRelay, roomId);
  const testPointer = createTestRoomPointer();
  const duplicatesPrimaryRoom = transportRelay === testPointer?.relayUrl && roomId === testPointer?.roomId;
  const testRoom = useRoomDefinition(testPointer && !duplicatesPrimaryRoom ? testPointer.relayUrl : undefined, testPointer?.roomId);
  const [entryError, setEntryError] = useState<string | null>(null);
  const featuredRoom = result.room || (TEST_ROOM_BUILD ? testRoom.room : null);
  const open = (room: RoomDescriptor, entryParams: ReturnType<typeof nearbyRoomEntryParams>) => router.push({ pathname: '/join-room', params: entryParams } as never);
  return (
    <DiscoverHandoffScreen
      error={entryError || result.error || nearby.error}
      loading={result.loading || nearby.scanning}
      onMap={() => {
        setEntryError(null);
        void Linking.openURL(roomMapSearchUrl(featuredRoom?.name)).catch(() => setEntryError('Maps could not be opened on this device. Use a venue QR, Nearby, or a room link.'));
      }}
      onNearby={() => router.push({ pathname: '/bluetooth-rationale', params: { relay: params.relay, room: params.room } } as never)}
      onOpenRoom={(room) => open(room, { relay: transportRelay || room.relayUrl, room: room.id })}
      onOpenTestRoom={(room) => testPointer && open(room, nearbyRoomEntryParams(testPointer))}
      onScan={() => router.push('/scan-room' as never)}
      room={result.room}
      testRoom={TEST_ROOM_BUILD && testPointer && !duplicatesPrimaryRoom ? { ...testRoom, testBuild: !__DEV__ } : undefined}
    />
  );
}

function ActiveRoomRoute({ activeRoom }: { activeRoom: ActiveRoom }) {
  const params = useLocalSearchParams<{ liked?: string; view?: string }>();
  const data = useRoomData();
  const { count: cartCount } = useCart();
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const stopLikePublishRef = useRef<(() => void) | null>(null);
  const stopReportPublishRef = useRef<(() => void) | null>(null);
  const view: RoomView = params.view === 'menu' || params.view === 'feed' ? params.view : 'people';
  const effectiveLikedPostIds = new Set([...likedPostIds, ...(params.liked || '').split(',').filter(Boolean)]);
  useEffect(() => () => {
    stopLikePublishRef.current?.();
    stopReportPublishRef.current?.();
  }, []);
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
      activeOrder={selectActiveOrder(data.orders)}
      cartCount={cartCount}
      connected={data.connected}
      loading={data.loading}
      onCart={() => router.push('/review-pay' as never)}
      onBecomeVisible={() => router.push({ pathname: '/join-room', params: { mode: 'visibility', relay: relayUrlFor(activeRoom), room: activeRoom.id } } as never)}
      onChangeView={(next) => router.setParams({ view: next === 'people' ? undefined : next })}
      onComposePost={() => router.push('/room-post' as never)}
      onInviteFriend={() => {
        void Share.share(roomInviteContent(activeRoom.name, relayUrlFor(activeRoom), activeRoom.id)).catch(() => undefined);
      }}
      onLikePost={likePost}
      onLeave={() => router.push('/leave-room' as never)}
      onOpenOrder={() => router.push('/orders' as never)}
      onOpenPerson={(pubkey) => router.push({ pathname: '/message-request' as never, params: { pubkey } })}
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

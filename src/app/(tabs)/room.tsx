import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish as publishToNostr } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useCart } from '@/commerce/Cart';
import { roomFeedTemplate, venueReportTemplate } from '@/nostr/protocol';
import { relayUrlFor } from '@/rooms/relayUrl';
import { useRoomData } from '@/rooms/RoomData';
import { RoomScreen, type RoomView } from '@/screens/room/RoomScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function RoomRoute() {
  const params = useLocalSearchParams<{ view?: string }>();
  const { activeRoom, endedRoom, hydrated } = useRoomSession();
  const data = useRoomData();
  const { count: cartCount } = useCart();
  const [composer, setComposer] = useState('');
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const stopPostPublishRef = useRef<(() => void) | null>(null);
  const stopReportPublishRef = useRef<(() => void) | null>(null);
  const view: RoomView = params.view === 'people' || params.view === 'feed' ? params.view : 'menu';
  useEffect(() => () => {
    stopPostPublishRef.current?.();
    stopReportPublishRef.current?.();
  }, []);

  if (!hydrated) return null;
  if (!activeRoom) return endedRoom?.reason === 'automatic'
    ? <Redirect href={{ pathname: '/room-ended', params: { name: endedRoom.name, reason: 'automatic' } } as never} />
    : <Redirect href="/discover" />;

  const publish = () => {
    const content = composer.trim();
    if (!content || composerLoading) return;
    setComposerLoading(true);
    setComposerError(null);
    let settled = false;
    let stop: () => void = () => undefined;
    const cancel = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      stop();
      stopPostPublishRef.current = null;
    };
    const finish = (failure?: string) => {
      if (settled) return;
      cancel();
      if (failure) setComposerError(failure);
      else setComposer('');
      setComposerLoading(false);
    };
    const timeout = setTimeout(() => finish('The room did not confirm this post. Check the connection and try again.'), 12_000);
    try {
      stop = publishToNostr(
        `room_post_${Date.now().toString(36)}`,
        roomFeedTemplate(
          activeRoom.id,
          content,
          Math.floor(activeRoom.leaveAt / 1000),
        ),
        (message: WorkerMessage) => {
          const status = isConnectionStatus(message);
          const value = status?.status()?.toString().toLowerCase() ?? '';
          if (value === 'ok' || value === 'true' || value.startsWith('true ')) finish();
          else if (value === 'failed' || value.startsWith('false') || value.startsWith('error')) {
            finish(status?.message()?.trim() || 'The room rejected this post.');
          }
        },
        { trackStatus: true, defaultRelays: [relayUrlFor(activeRoom)] },
      );
      stopPostPublishRef.current = cancel;
    } catch (cause) {
      clearTimeout(timeout);
      stop();
      setComposerError(cause instanceof Error ? cause.message : 'The post could not be sent.');
      setComposerLoading(false);
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
      composer={composer}
      composerError={composerError}
      composerLoading={composerLoading}
      connected={data.connected}
      loading={data.loading}
      onCart={() => router.push('/review-pay' as never)}
      onChangeComposer={setComposer}
      onChangeView={(next) => router.setParams({ view: next === 'menu' ? undefined : next })}
      onLeave={() => router.push('/leave-room' as never)}
      onMyNight={() => router.push('/my-night' as never)}
      onOpenPerson={(pubkey) => router.push({ pathname: '/person' as never, params: { pubkey } })}
      onOpenProduct={(product) => router.push({ pathname: '/item' as never, params: { id: product.id } })}
      onPublish={publish}
      onReportPost={reportPost}
      people={data.people}
      posts={data.posts}
      products={data.products}
      profiles={data.profiles}
      reportingPostId={reportingPostId}
      reportNotice={reportNotice}
      view={view}
    />
  );
}

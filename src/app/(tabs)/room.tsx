import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ensureActiveIdentity } from '@/account/account';
import { useCart } from '@/commerce/Cart';
import { publishEvent } from '@/nostr/publish';
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
  const view: RoomView = params.view === 'people' || params.view === 'feed' ? params.view : 'menu';

  if (!hydrated) return null;
  if (!activeRoom) return endedRoom?.reason === 'automatic'
    ? <Redirect href={{ pathname: '/room-ended', params: { name: endedRoom.name, reason: 'automatic' } } as never} />
    : <Redirect href="/discover" />;

  const publish = async () => {
    const content = composer.trim();
    if (!content || composerLoading) return;
    setComposerLoading(true);
    setComposerError(null);
    try {
      await ensureActiveIdentity();
      await publishEvent(
        roomFeedTemplate(
          activeRoom.id,
          content,
          Math.floor(activeRoom.leaveAt / 1000),
        ),
        [relayUrlFor(activeRoom)],
        'room_post',
      );
      setComposer('');
    } catch (cause) {
      setComposerError(cause instanceof Error ? cause.message : 'The post could not be sent.');
    } finally {
      setComposerLoading(false);
    }
  };

  const reportPost = async (post: (typeof data.posts)[number]) => {
    if (reportingPostId) return;
    setReportingPostId(post.id); setReportNotice(null);
    try {
      await ensureActiveIdentity();
      await publishEvent(venueReportTemplate(post.pubkey, activeRoom.id, 'other', post.id), [relayUrlFor(activeRoom)], 'feed_report');
      setReportNotice('Report sent to this venue. The post remains visible unless you block its author.');
    } catch (cause) { setReportNotice(cause instanceof Error ? cause.message : 'The venue did not confirm this report.'); }
    finally { setReportingPostId(null); }
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
      onReportPost={(post) => void reportPost(post)}
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

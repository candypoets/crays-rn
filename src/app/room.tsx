import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ensureLocalIdentity } from '@/account/account';
import { publishEvent } from '@/nostr/publish';
import { roomFeedTemplate, venueReportTemplate } from '@/nostr/protocol';
import { useRoomData } from '@/rooms/RoomData';
import { RoomScreen, type RoomView } from '@/screens/room/RoomScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function RoomRoute() {
  const params = useLocalSearchParams<{ view?: string }>();
  const { activeRoom, endedRoom, hydrated } = useRoomSession();
  const data = useRoomData();
  const [composer, setComposer] = useState('');
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const view: RoomView = params.view === 'feed' ? 'feed' : 'people';

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
      await ensureLocalIdentity();
      await publishEvent(
        roomFeedTemplate(
          activeRoom.id,
          content,
          Math.min(activeRoom.expiresAt, Math.floor(activeRoom.leaveAt / 1000)),
        ),
        [activeRoom.connectionRelayUrl || activeRoom.relayUrl],
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
      await ensureLocalIdentity();
      await publishEvent(venueReportTemplate(post.pubkey, activeRoom.id, 'other', post.id), [activeRoom.connectionRelayUrl || activeRoom.relayUrl], 'feed_report');
      setReportNotice('Report sent to this venue. The post remains visible unless you block its author.');
    } catch (cause) { setReportNotice(cause instanceof Error ? cause.message : 'The venue did not confirm this report.'); }
    finally { setReportingPostId(null); }
  };

  return (
    <RoomScreen
      activeRoom={activeRoom}
      composer={composer}
      composerError={composerError}
      composerLoading={composerLoading}
      connected={data.connected}
      loading={data.loading}
      onChangeComposer={setComposer}
      onChangeView={(next) => router.setParams({ view: next === 'feed' ? 'feed' : undefined })}
      onLeave={() => router.push('/leave-room' as never)}
      onMenu={() => router.push('/menu' as never)}
      onMyNight={() => router.push('/my-night' as never)}
      onOpenPerson={(pubkey) => router.push({ pathname: '/person' as never, params: { pubkey } })}
      onPublish={publish}
      onReportPost={(post) => void reportPost(post)}
      people={data.people}
      posts={data.posts}
      profiles={data.profiles}
      reportingPostId={reportingPostId}
      reportNotice={reportNotice}
      view={view}
    />
  );
}

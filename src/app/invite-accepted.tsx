import { router, useLocalSearchParams } from 'expo-router';
import { clearEntryContext } from '@/account/context';
import { InviteAcceptedScreen } from '@/screens/onboarding/InviteAcceptedScreen';

export default function InviteAcceptedRoute() {
  const params = useLocalSearchParams<{ event?: string; relay?: string; room?: string; name?: string }>();
  return <InviteAcceptedScreen eventId={params.event || 'unknown'} roomName={params.name || 'this venue'} onMembership={() => { void clearEntryContext(); router.replace({ pathname: '/membership-detail', params: { source: 'invite', room: params.room } } as never); }} onJoinRoom={() => { void clearEntryContext(); router.replace({ pathname: '/room-preview', params: { relay: params.relay, room: params.room } } as never); }} />;
}

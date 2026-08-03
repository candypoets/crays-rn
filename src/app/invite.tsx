import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { getLocalPubkey } from '@/account/account';
import { saveEntryContext } from '@/account/context';
import { loadInvitePreview, redeemInvite, type InvitePreview, type InviteRedemption } from '@/invites/invites';
import { useRoomManifest } from '@/rooms/useRoomManifest';
import { InvitePreviewScreen } from '@/screens/onboarding/InvitePreviewScreen';

export default function InviteRoute() {
  const params = useLocalSearchParams<{ service?: string; relay?: string; room?: string; token?: string }>();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const transportRelay = params.relay || preview?.community.relay_url;
  const manifest = useRoomManifest(transportRelay, params.room);
  const context = useMemo(() => params.service && params.token ? ({ kind: 'invite' as const, serviceUrl: params.service, relayUrl: params.relay, roomId: params.room, token: params.token }) : null, [params.relay, params.room, params.service, params.token]);

  useEffect(() => {
    let active = true;
    // A retry changes the remote invite projection owned by this route.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError(null);
    Promise.all([
      params.service && params.token ? loadInvitePreview(params.service, params.token) : Promise.reject(new Error('This invite link is missing required information.')),
      getLocalPubkey(),
    ]).then(([nextPreview, nextPubkey]) => { if (active) { setPreview(nextPreview); setPubkey(nextPubkey); } }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'This invite could not be checked.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt, params.service, params.token]);

  const preserveAndGo = async (destination: '/login' | '/account-access') => {
    if (context) await saveEntryContext(context);
    router.push({ pathname: destination, params: { resume: 'invite' } } as never);
  };
  const accept = async () => {
    if (!preview || !params.token || !pubkey) { setAttempt((value) => value + 1); return; }
    setRedeeming(true); setError(null);
    try {
      const result: InviteRedemption = await redeemInvite(preview, params.token, pubkey);
      router.replace({ pathname: '/invite-accepted', params: { event: result.eventId, relay: transportRelay, room: params.room, name: manifest.room?.name || 'this venue' } } as never);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The invite could not be accepted.'); }
    finally { setRedeeming(false); }
  };
  return <InvitePreviewScreen error={error || manifest.error} hasIdentity={Boolean(pubkey)} loading={loading} onAccept={accept} onBack={() => router.canGoBack() ? router.back() : router.replace('/welcome')} onCreateAccount={() => void preserveAndGo('/account-access')} onLogIn={() => void preserveAndGo('/login')} preview={preview} redeeming={redeeming} room={manifest.room} />;
}

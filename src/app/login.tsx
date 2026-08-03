import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ensureLocalIdentity, getLocalPubkey } from '@/account/account';
import { entryContextHref, getEntryContext } from '@/account/context';
import { LoginScreen } from '@/screens/onboarding/LoginScreen';

export default function LoginRoute() {
  const [hasIdentity, setHasIdentity] = useState(false); const [preservingInvite, setPreservingInvite] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { Promise.all([getLocalPubkey(), getEntryContext()]).then(([key, context]) => { setHasIdentity(Boolean(key)); setPreservingInvite(context?.kind === 'invite'); }).finally(() => setLoading(false)); }, []);
  const unlock = async () => { setLoading(true); setError(null); try { await ensureLocalIdentity(); const context = await getEntryContext(); router.replace(context ? entryContextHref(context) as never : '/discover'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'This account could not be unlocked.'); } finally { setLoading(false); } };
  return <LoginScreen error={error} hasDeviceIdentity={hasIdentity} loading={loading} onBack={() => router.back()} onCreateAccount={() => router.replace('/account-access')} onRecovery={() => router.push('/account-recovery' as never)} onUnlock={unlock} preservingInvite={preservingInvite} />;
}

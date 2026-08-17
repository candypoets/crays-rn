import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { completeLocalOnboarding, readLocalAccountSummary, type LocalAccountSummary } from '@/account/account';
import { entryContextHref, getEntryContext } from '@/account/context';
import { RecoveryScreen } from '@/screens/onboarding/RecoveryScreen';

export default function RecoveryRoute() {
  const params = useLocalSearchParams<{ resume?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [custody, setCustody] = useState<LocalAccountSummary['custody'] | null>(null);

  useEffect(() => {
    let active = true;
    void readLocalAccountSummary().then((result) => {
      if (!active) return;
      if (result.status === 'ready') setCustody(result.account.custody);
      else setError('Crays could not verify the identity setup on this device.');
    }).catch(() => {
      if (active) setError('Crays could not read the saved signing account on this device.');
    });
    return () => { active = false; };
  }, []);

  const finish = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await completeLocalOnboarding();
      const context = params.resume ? await getEntryContext() : null;
      router.replace(context ? entryContextHref(context) as never : '/discover');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Crays could not finish the account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecoveryScreen
      custody={custody}
      error={error}
      loading={loading}
      onBack={() => router.replace('/profile')}
      onFinish={finish}
    />
  );
}

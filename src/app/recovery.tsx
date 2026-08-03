import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { completeLocalOnboarding } from '@/account/account';
import { entryContextHref, getEntryContext } from '@/account/context';
import { RecoveryScreen } from '@/screens/onboarding/RecoveryScreen';

export default function RecoveryRoute() {
  const params = useLocalSearchParams<{ resume?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      error={error}
      loading={loading}
      onBack={() => router.replace('/profile')}
      onFinish={finish}
    />
  );
}

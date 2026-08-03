import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ensureLocalIdentity } from '@/account/account';
import { AccountAccessScreen } from '@/screens/onboarding/AccountAccessScreen';

export default function AccountAccessRoute() {
  const params = useLocalSearchParams<{ resume?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOnDevice = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await ensureLocalIdentity();
      router.push({ pathname: '/profile', params: { resume: params.resume } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Crays could not create the account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountAccessScreen
      error={error}
      loading={loading}
      onBack={() => router.back()}
      onCreateOnDevice={createOnDevice}
      onLogIn={() => router.replace({ pathname: '/login', params: { resume: params.resume } })}
    />
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { createLocalProfile } from '@/account/account';
import { ProfileSetupScreen } from '@/screens/onboarding/ProfileSetupScreen';

export default function ProfileRoute() {
  const params = useLocalSearchParams<{ resume?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueWithName = async (displayName: string) => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await createLocalProfile(displayName);
      router.replace({ pathname: '/recovery', params: { resume: params.resume } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Crays could not save the profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileSetupScreen
      error={error}
      loading={loading}
      onBack={() => router.back()}
      onContinue={continueWithName}
    />
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { completeLocalOnboarding, createLocalIdentity, createLocalProfile, getLocalPubkey } from '@/account/account';
import { entryContextHref, getEntryContext } from '@/account/context';
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
      if (!await getLocalPubkey()) await createLocalIdentity();
      await createLocalProfile(displayName);
      await completeLocalOnboarding();
      const context = params.resume ? await getEntryContext() : null;
      router.replace(context ? entryContextHref(context) as never : '/room');
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

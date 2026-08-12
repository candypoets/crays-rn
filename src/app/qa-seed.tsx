import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { seedQaIdentity } from '@/account/account';
import { PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import { setQaTestRoomPointer } from '@/config/testRoom';

export default function QaSeedRoute() {
  const params = useLocalSearchParams<{ nsec?: string; next?: string; service?: string; relay?: string; room?: string; token?: string; testRelay?: string }>();
  const [error, setError] = useState<string | null>(null); const [ready, setReady] = useState(false);
  const invalidError = !__DEV__ || !params.nsec ? 'This QA-only route is unavailable.' : null;
  useEffect(() => {
    if (!params.nsec || !__DEV__) return;
    seedQaIdentity(params.nsec)
      .then(() => {
        if (params.next === 'test-room') {
          if (!params.service || !params.relay || !params.room || !params.token) throw new Error('Test Room QA pointer is incomplete.');
          setQaTestRoomPointer({ serviceUrl: params.service, relayUrl: params.relay, roomId: params.room, token: params.token });
        }
        setReady(true);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'QA identity setup failed.'));
  }, [params.nsec, params.next, params.relay, params.room, params.service, params.token]);
  if (!__DEV__) return <Redirect href="/" />;
  const go = () => params.next === 'invite'
    ? router.replace({ pathname: '/invite', params: { service: params.service, relay: params.relay, room: params.room, token: params.token } } as never)
    : router.replace({ pathname: '/discover', params: params.testRelay ? { testRelay: params.testRelay } : {} } as never);
  return <View className="flex-1 items-center justify-center bg-base-100 px-7" testID="qa-seed-screen">{!ready && !error && !invalidError ? <><ActivityIndicator /><Text className="mt-4 text-muted">Preparing signed QA identity…</Text></> : null}{ready ? <><Text className="text-xl font-black text-base-content">QA identity ready</Text><View className="mt-5 w-full"><PrimaryButton label="Continue QA" onPress={go} testID="qa-seed-continue" /></View></> : null}{error || invalidError ? <Text className="text-center text-error">{error || invalidError}</Text> : null}</View>;
}

import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEntryDestination } from '@/account/account';
import { resolveResumeDestination, type AppEntryDestination } from '@/account/state';
import { TempoRail } from '@/components/night/NightPrimitives';
import { BrandMark } from '@/components/onboarding/OnboardingPrimitives';
import { getStoredActiveRoom } from '@/session/RoomSession';

export default function EntryRoute() {
  const [destination, setDestination] = useState<AppEntryDestination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getEntryDestination(), getStoredActiveRoom()])
      .then(([next, room]) => {
        if (active) setDestination(resolveResumeDestination(next, Boolean(room)));
      })
      .catch(() => {
        if (active) setError('Crays could not read the protected account state.');
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  if (destination) return <Redirect href={destination} />;

  return (
    <SafeAreaView className="flex-1 bg-base-100" testID="entry-router-screen">
      <View className="flex-1 items-center justify-center px-8">
        <BrandMark size={72} />
        {error ? (
          <>
            <Text accessibilityRole="alert" className="mt-6 text-center text-base leading-6 text-base-content">{error}</Text>
            <Pressable
              accessibilityRole="button"
              className="mt-4 min-h-12 items-center justify-center px-6"
              onPress={() => {
                setError(null);
                setAttempt((value) => value + 1);
              }}
              testID="entry-retry"
            >
              <Text className="font-bold text-primary">Try again</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View accessibilityLabel="Opening Crays" accessibilityRole="progressbar" accessible className="mt-6 items-center">
              <TempoRail className="w-44" />
              <Text className="mt-3 text-sm font-semibold text-muted">Opening Crays…</Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

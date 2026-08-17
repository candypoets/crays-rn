import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/onboarding/OnboardingPrimitives';
import { TempoRail } from '@/components/night/NightPrimitives';
import type { NostrRuntimeStatus } from '@/nostr/manager';

type FoundationScreenProps = {
  engineStatus: NostrRuntimeStatus;
};

const statusCopy: Record<NostrRuntimeStatus, string> = {
  ready: 'Nostr engine ready',
  unavailable: 'Nostr engine unavailable',
  error: 'Nostr engine failed to start',
};

export function FoundationScreen({ engineStatus }: FoundationScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-base-100" testID="foundation-screen">
      <View className="flex-1 items-center justify-center px-8">
        <BrandMark size={64} />
        <Text
          accessibilityRole="header"
          className="mt-6 text-[48px] font-extrabold tracking-[-1.8px] text-base-content"
        >
          Crays
        </Text>
        <Text className="mt-2.5 text-center text-lg leading-7 text-muted">
          Your night, in one place.
        </Text>
        <TempoRail className="mt-8 w-48" />
        <View
          accessibilityLabel={statusCopy[engineStatus]}
          accessibilityRole="text"
          className="mt-8 flex-row items-center gap-2 rounded-full border border-edge bg-surface px-4 py-2.5"
          testID="nostr-engine-status"
        >
          <View
            className={`h-2.5 w-2.5 rounded-full ${
              engineStatus === 'ready' ? 'bg-success' : 'bg-error'
            }`}
          />
          <Text className="text-sm font-semibold text-base-content">
            {statusCopy[engineStatus]}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

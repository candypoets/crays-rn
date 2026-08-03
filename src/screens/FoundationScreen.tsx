import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <Text
          accessibilityRole="header"
          className="text-[56px] font-bold tracking-[-2px] text-base-content"
        >
          Crays
        </Text>
        <Text className="mt-2.5 text-center text-lg leading-7 text-muted">
          Meet the people in the room.
        </Text>
        <View
          accessibilityLabel={statusCopy[engineStatus]}
          accessibilityRole="text"
          className="mt-10 flex-row items-center gap-2 rounded-full border border-base-300 bg-base-200 px-4 py-2.5"
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

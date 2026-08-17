import '../../global.css';
import '@/polyfills/text-encoding';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useSyncExternalStore, type PropsWithChildren } from 'react';
import { AppState, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TempoRail } from '@/components/night/NightPrimitives';
import { nostrAuthStore } from '@/nostr/auth';
import { getNostrRuntime, type NostrRuntimeStatus } from '@/nostr/manager';
import { FoundationScreen } from '@/screens/FoundationScreen';
import { CartProvider } from '@/commerce/Cart';
import { RoomDataProvider } from '@/rooms/RoomData';
import { RoomSessionProvider } from '@/session/RoomSession';
import { SafetyProvider } from '@/safety/Safety';

function RuntimeGate({ children }: PropsWithChildren) {
  const [runtimeStatus, setRuntimeStatus] = useState<NostrRuntimeStatus | null>(null);
  const auth = useSyncExternalStore(nostrAuthStore.subscribe, nostrAuthStore.getSnapshot);

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleReady = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const runtime = getNostrRuntime();
        setRuntimeStatus(runtime.status);
      }, 500);
    };

    if (AppState.currentState === 'active') scheduleReady();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') scheduleReady();
      else {
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = null;
      }
    });

    return () => {
      subscription.remove();
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, []);

  if (!runtimeStatus || (runtimeStatus === 'ready' && !auth.resolved)) {
    return (
      <View className="flex-1 items-center justify-center bg-base-100" testID="runtime-gate">
        <Text className="text-3xl font-black tracking-[-0.8px] text-base-content">CRAYS</Text>
        <TempoRail className="mt-5 w-44" />
        <Text className="mt-3 text-xs font-bold tracking-[0.8px] text-muted">
          Waking the room
        </Text>
      </View>
    );
  }

  // A failed native engine is an explicit screen, never a silently broken app.
  if (runtimeStatus !== 'ready') {
    return <FoundationScreen engineStatus={runtimeStatus} />;
  }

  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RuntimeGate>
        <RoomSessionProvider>
          <SafetyProvider>
            <RoomDataProvider>
              <CartProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
                  <Stack.Screen name="room-thread" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="room-post" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                </Stack>
              </CartProvider>
            </RoomDataProvider>
          </SafetyProvider>
        </RoomSessionProvider>
      </RuntimeGate>
    </SafeAreaProvider>
  );
}

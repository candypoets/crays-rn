import '../../global.css';
import '@/polyfills/text-encoding';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getNostrRuntime } from '@/nostr/manager';
import { CartProvider } from '@/commerce/Cart';
import { RoomDataProvider } from '@/rooms/RoomData';
import { RoomSessionProvider } from '@/session/RoomSession';
import { SafetyProvider } from '@/safety/Safety';

function RuntimeGate({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleReady = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        getNostrRuntime();
        setReady(true);
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

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-base-100" testID="runtime-gate">
        <Text className="text-3xl font-black tracking-[8px] text-base-content">CRAYS</Text>
        <Text className="mt-3 text-xs font-bold uppercase tracking-[3px] text-muted">
          Waking the room
        </Text>
      </View>
    );
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
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
                </Stack>
              </CartProvider>
            </RoomDataProvider>
          </SafetyProvider>
        </RoomSessionProvider>
      </RuntimeGate>
    </SafeAreaProvider>
  );
}

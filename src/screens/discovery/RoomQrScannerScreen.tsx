import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

type Props = {
  error?: string | null;
  onBack: () => void;
  onRequestPermission: () => void;
  onScan: (value: string) => void;
  permission: 'checking' | 'prompt' | 'denied' | 'granted';
};

export function RoomQrScannerScreen({ error, onBack, onRequestPermission, onScan, permission }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-canvas px-5" testID="room-qr-scanner-screen">
      <View className="mx-auto w-full max-w-[620px] grow py-3">
        <Pressable accessibilityLabel="Back to Tonight" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full active:bg-surface-soft" onPress={onBack} testID="qr-back">
          <Ionicons color={colors.ink} name="arrow-back" size={25} />
        </Pressable>
        <Text accessibilityRole="header" className="mt-3 text-[34px] font-black leading-[38px] text-ink">Scan a venue QR</Text>
        <Text className="mt-2 text-base leading-6 text-muted">Crays reads the room pointer, then independently verifies the venue before showing entry choices.</Text>

        {permission === 'granted' ? (
          <View className="mt-6 aspect-square overflow-hidden rounded-3xl bg-photo-night" testID="qr-camera-frame">
            <CameraView
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              className="flex-1"
              facing="back"
              onBarcodeScanned={({ data }) => onScan(data)}
            />
            <View className="pointer-events-none absolute inset-10 rounded-3xl border-2 border-white" />
          </View>
        ) : (
          <View className="mt-6 min-h-72 items-center justify-center rounded-3xl border border-edge bg-surface p-7">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-soft">
              <Ionicons color={colors.primary} name="qr-code-outline" size={31} />
            </View>
            <Text className="mt-5 text-center text-xl font-black text-ink">
              {permission === 'denied' ? 'Camera access is off' : permission === 'checking' ? 'Checking camera access…' : 'Camera only when you choose'}
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-muted">
              {permission === 'denied' ? 'Allow camera access to scan a venue code, or return to use Map, Nearby, or a room link.' : 'No photo is saved or uploaded. Scanning does not join a room or publish presence.'}
            </Text>
          </View>
        )}

        {error ? <Text accessibilityRole="alert" className="mt-4 text-sm font-semibold leading-5 text-error">{error}</Text> : null}
        {permission === 'prompt' || permission === 'denied' ? (
          <View className="mt-auto pt-6">
            <PrimaryButton label={permission === 'denied' ? 'Try camera access again' : 'Use camera'} onPress={onRequestPermission} testID="request-camera" />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { parseRoomEntryCode } from '@/discovery/roomEntry';
import { RoomQrScannerScreen } from '@/screens/discovery/RoomQrScannerScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function ScanRoomRoute() {
  const [permission, requestPermission] = useCameraPermissions();
  const { activeRoom } = useRoomSession();
  const [error, setError] = useState<string | null>(null);
  const handling = useRef(false);
  const scan = (value: string) => {
    if (handling.current) return;
    const params = parseRoomEntryCode(value);
    if (!params) {
      setError('That code is not a Crays room link. Try another venue code.');
      return;
    }
    handling.current = true;
    router.replace({
      pathname: activeRoom && activeRoom.id !== params.room ? '/switch-room' : '/join-room',
      params,
    } as never);
  };
  return (
    <RoomQrScannerScreen
      error={error}
      onBack={() => router.back()}
      onRequestPermission={() => void requestPermission()}
      onScan={scan}
      permission={!permission ? 'checking' : permission.granted ? 'granted' : permission.canAskAgain ? 'prompt' : 'denied'}
    />
  );
}

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { scanForNearbyRoom, type NearbyRoomPointer } from '@/discovery/ble';

export function useNearbyRoom(enabled: boolean) {
  const [pointer, setPointer] = useState<NearbyRoomPointer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let stop = () => {};
    const start = () => { setError(null); stop(); stop = scanForNearbyRoom({ onError: setError, onPointer: setPointer, onScanning: setScanning }); };
    if (AppState.currentState === 'active') start();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') start(); else stop(); });
    return () => { subscription.remove(); stop(); };
  }, [enabled]);
  return { error, pointer, scanning };
}

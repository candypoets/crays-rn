import { BleManager, type Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { decodeNearbyRoomPointer } from '@/discovery/blePointer';

/** Versioned pilot GATT contract. Gateway implementation must use these exact UUIDs. */
export const CRAYS_ROOM_SERVICE_UUID = '43524159-5300-4c49-4645-000000000001';
export const CRAYS_ROOM_POINTER_CHARACTERISTIC_UUID = '43524159-5300-4c49-4645-000000000002';

export type NearbyRoomPointer = { relayUrl: string; roomId: string; deviceId: string };

export type NearbyPermission = 'granted' | 'denied' | 'blocked';

export async function requestNearbyPermission(): Promise<NearbyPermission> {
  if (Platform.OS !== 'android') return 'granted';
  const version = Number(Platform.Version);
  const permissions = version >= 31
    ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(permissions);
  const values = permissions.map((permission) => result[permission]);
  if (values.every((value) => value === PermissionsAndroid.RESULTS.GRANTED)) return 'granted';
  return values.some((value) => value === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) ? 'blocked' : 'denied';
}

async function readPointer(device: Device): Promise<NearbyRoomPointer | null> {
  let connected: Device | null = null;
  try {
    connected = await device.connect({ timeout: 8000 });
    await connected.discoverAllServicesAndCharacteristics();
    const characteristic = await connected.readCharacteristicForService(CRAYS_ROOM_SERVICE_UUID, CRAYS_ROOM_POINTER_CHARACTERISTIC_UUID);
    const pointer = decodeNearbyRoomPointer(characteristic.value);
    return pointer ? { ...pointer, deviceId: device.id } : null;
  } finally {
    if (connected) await connected.cancelConnection().catch(() => undefined);
  }
}

export function scanForNearbyRoom({ onError, onPointer, onScanning }: { onError: (message: string) => void; onPointer: (pointer: NearbyRoomPointer) => void; onScanning: (scanning: boolean) => void }): () => void {
  const manager = new BleManager();
  let stopped = false; let reading = false; let timeout: ReturnType<typeof setTimeout> | null = null;
  const stop = () => { if (stopped) return; stopped = true; if (timeout) clearTimeout(timeout); manager.stopDeviceScan(); manager.destroy(); onScanning(false); };
  const start = () => {
    if (stopped) return;
    onScanning(true);
    manager.startDeviceScan([CRAYS_ROOM_SERVICE_UUID], { allowDuplicates: false }, (error, device) => {
      if (stopped) return;
      if (error) { onError(error.message || 'Nearby scanning failed.'); stop(); return; }
      if (!device || reading) return;
      reading = true;
      readPointer(device).then((pointer) => { if (pointer && !stopped) { onPointer(pointer); stop(); } }).catch(() => undefined).finally(() => { reading = false; });
    });
    timeout = setTimeout(() => { if (!stopped) { onError('No participating room was found nearby. Map and room links still work.'); stop(); } }, 12_000);
  };
  const stateSubscription = manager.onStateChange((state) => {
    if (state === State.PoweredOn) { stateSubscription.remove(); start(); }
    else if (state === State.PoweredOff) { onError('Bluetooth is off. Turn it on or use Map instead.'); stop(); }
    else if (state === State.Unauthorized) { onError('Nearby Devices permission is off. Use Map or enable it in Settings.'); stop(); }
  }, true);
  return stop;
}

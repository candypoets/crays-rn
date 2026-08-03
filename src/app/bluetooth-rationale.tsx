import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { requestNearbyPermission } from '@/discovery/ble';
import { BluetoothRationaleScreen } from '@/screens/discovery/BluetoothRationaleScreen';

export default function BluetoothRationaleRoute() {
  const params = useLocalSearchParams<{ relay?: string; room?: string }>();
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const continueNearby = async () => { if (loading) return; setLoading(true); setError(null); try { const permission = await requestNearbyPermission(); if (permission !== 'granted') { setError(permission === 'blocked' ? 'Nearby Devices is blocked. Use Map or enable it in system Settings.' : 'Nearby Devices was not allowed. You can keep using Map and room links.'); return; } router.push(params.relay ? { pathname: '/join-room' as never, params } as never : { pathname: '/discover' as never, params: { nearby: '1' } } as never); } catch { setError('Crays could not request Nearby Devices. Use Map instead.'); } finally { setLoading(false); } };
  return <BluetoothRationaleScreen error={error} loading={loading} onContinue={() => void continueNearby()} onMap={() => router.replace(params.relay ? { pathname: '/discover', params } as never : '/discover')} />;
}

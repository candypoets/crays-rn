import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AppState, Modal, Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { canPresentEntitlement } from '@/access/entitlements';
import { createEntitlementPresentation, PRESENTATION_LIFETIME_SECONDS, PRESENTATION_REFRESH_MS } from '@/access/presentation';
import type { RoomEntitlement } from '@/rooms/types';
import { colors } from '@/theme/colors';

export function EntitlementPresentation({ item }: { item: RoomEntitlement }) {
  const [payload, setPayload] = useState('');
  const [error, setError] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const generation = useRef(0);
  const presentable = canPresentEntitlement(item);
  const visiblePayload = presentable ? payload : '';

  useEffect(() => {
    if (!presentable) return;
    let cancelled = false;
    let expiryTimer: ReturnType<typeof setTimeout> | null = null;
    const refresh = async () => {
      const current = ++generation.current;
      try {
        const next = await createEntitlementPresentation(item);
        if (!cancelled && current === generation.current) {
          setPayload(next.payload);
          setError('');
          if (expiryTimer) clearTimeout(expiryTimer);
          const expiresIn = Math.max(0, (next.event.created_at + PRESENTATION_LIFETIME_SECONDS) * 1000 - Date.now());
          expiryTimer = setTimeout(() => setPayload(''), expiresIn);
        }
      } catch (cause) {
        if (!cancelled && current === generation.current) {
          setPayload('');
          setError(cause instanceof Error ? cause.message : 'Could not prepare a live code.');
        }
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), PRESENTATION_REFRESH_MS);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
      else setPayload('');
    });
    return () => { cancelled = true; clearInterval(timer); if (expiryTimer) clearTimeout(expiryTimer); appState.remove(); };
  }, [item, presentable]);

  const unavailable = ({ exhausted: 'No uses remain.', expired: 'This credential has expired.', revoked: 'This credential was revoked.', cancelled: 'This credential was cancelled.' } as Record<string, string>)[item.state];
  return <>
    <Pressable
      accessibilityRole={visiblePayload ? 'button' : undefined}
      accessibilityLabel={visiblePayload ? 'Present fullscreen' : 'Presentation unavailable'}
      className="items-center rounded-[26px] bg-white p-7"
      disabled={!visiblePayload}
      onPress={() => setFullscreen(true)}
      testID="entitlement-presentation"
    >
      {visiblePayload ? <QRCode backgroundColor="white" color={colors.night} ecl="M" quietZone={10} size={190} value={visiblePayload} /> : <View className="h-[190px] w-[190px] items-center justify-center px-4"><Ionicons color={colors.night} name="qr-code-outline" size={72} /><Text className="mt-3 text-center text-sm font-bold text-paper-ink">{error || unavailable || 'Preparing a fresh code…'}</Text></View>}
      {visiblePayload ? <Text className="mt-4 text-center text-sm font-bold text-paper-ink">Live code · refreshes automatically · tap to enlarge</Text> : null}
    </Pressable>
    <Modal animationType="fade" onRequestClose={() => setFullscreen(false)} transparent visible={fullscreen}>
      <View className="flex-1 items-center justify-center bg-black/90 px-5">
        <View className="w-full items-center rounded-[30px] bg-white p-7">
          {visiblePayload ? <QRCode backgroundColor="white" color={colors.night} ecl="M" quietZone={12} size={280} value={visiblePayload} /> : null}
          <Text className="mt-5 text-center text-xl font-black text-paper-ink">{item.name}</Text>
          <Text className="mt-2 text-center text-sm font-semibold text-paper-muted">Signed for this identity · expires and refreshes automatically</Text>
        </View>
        <Pressable accessibilityRole="button" className="mt-6 min-h-12 min-w-32 items-center justify-center rounded-full bg-white" onPress={() => setFullscreen(false)}><Text className="font-black text-paper-ink">Close</Text></Pressable>
      </View>
    </Modal>
  </>;
}

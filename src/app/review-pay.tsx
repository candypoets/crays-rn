import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';

import { useCart } from '@/commerce/Cart';
import { requestCheckoutUrl } from '@/commerce/checkout';
import { useRoomData } from '@/rooms/RoomData';
import { ReviewPayScreen, type CheckoutState } from '@/screens/commerce/ReviewPayScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function ReviewPayRoute() {
  const { method = 'Choose a method' } = useLocalSearchParams<{ method?: string }>();
  const { activeRoom, hydrated } = useRoomSession();
  const { cart, clear, total, remove, setQuantity } = useCart();
  const { loading: roomLoading, orders } = useRoomData();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const baselineOrderIds = useRef<Set<string> | null>(null);
  const checkoutStartedAt = useRef(0);

  useEffect(() => {
    if (!roomLoading && !baselineOrderIds.current) baselineOrderIds.current = new Set(orders.map((order) => order.id));
  }, [orders, roomLoading]);

  useEffect(() => {
    const line = cart?.lines.length === 1 ? cart.lines[0] : undefined;
    if (checkoutState !== 'opened' || !line || !checkoutStartedAt.current || !baselineOrderIds.current) return;
    const confirmed = orders.find((order) =>
      !baselineOrderIds.current?.has(order.id) &&
      order.product.address === line.address &&
      order.createdAt >= checkoutStartedAt.current - 2,
    );
    if (!confirmed) return;
    router.replace({ pathname: '/order', params: { ref: confirmed.orderRef } } as never);
    void clear();
  }, [cart, checkoutState, clear, orders]);

  const startCheckout = async () => {
    const line = cart?.lines.length === 1 ? cart.lines[0] : undefined;
    if (!activeRoom || !line || line.quantity !== 1 || line.recipientPubkey || method === 'Wallet' || checkoutState === 'opening' || checkoutState === 'opened') return;
    setCheckoutState('opening');
    setCheckoutError(null);
    checkoutStartedAt.current = Math.floor(Date.now() / 1000);
    try {
      // The signed relay URL is the community authority. A connectionRelayUrl
      // may be a local test proxy and must never be sent to the payment service.
      const url = await requestCheckoutUrl({ community: activeRoom.relayUrl, eventAddress: line.address });
      await Linking.openURL(url);
      setCheckoutState('opened');
    } catch (cause) {
      setCheckoutState('idle');
      setCheckoutError(cause instanceof Error ? cause.message : 'Stripe checkout could not be opened.');
    }
  };

  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  if (!cart?.lines.length || cart.roomId !== activeRoom.id) return <Redirect href="/menu" />;
  const line = cart.lines.length === 1 ? cart.lines[0] : undefined;
  const checkoutDisabledReason = cart.lines.length !== 1
    ? 'Stripe checkout currently supports one menu item per payment. Remove the other items first.'
    : line?.quantity !== 1
      ? 'Stripe checkout currently supports one serving per payment. Set quantity to 1 to continue.'
      : line.recipientPubkey
        ? 'Gift orders need the recipient claim flow and are not available through this checkout yet.'
        : method === 'Wallet'
          ? 'Cashu wallet checkout is not connected here. Choose Card, Apple Pay, or Google Pay.'
          : null;
  return <ReviewPayScreen cart={cart} checkoutDisabledReason={checkoutDisabledReason} checkoutError={checkoutError} checkoutState={checkoutState} method={method} onBack={() => router.push('/menu' as never)} onCheckout={() => void startCheckout()} onChangeMethod={() => router.push({ pathname: '/payment-methods' as never, params: { selected: method } })} onChangeQuantity={setQuantity} onRemove={remove} total={total} />;
}

import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { useCart } from '@/commerce/Cart';
import { GiftReviewScreen } from '@/screens/commerce/GiftReviewScreen';

export default function GiftReviewRoute() {
  const { method = 'Choose a method' } = useLocalSearchParams<{ method?: string }>();
  const { cart, hydrated } = useCart();
  if (!hydrated) return null;
  const line = cart?.lines.find((value) => value.recipientPubkey);
  if (!line) return <Redirect href="/room" />;
  return <GiftReviewScreen line={line} method={method} onBack={() => router.back()} onChangeMethod={() => router.push({ pathname: '/payment-methods' as never, params: { selected: method, returnTo: 'gift-review' } })} />;
}

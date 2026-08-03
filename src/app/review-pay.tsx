import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { useCart } from '@/commerce/Cart';
import { ReviewPayScreen } from '@/screens/commerce/ReviewPayScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function ReviewPayRoute() {
  const { method = 'Choose a method' } = useLocalSearchParams<{ method?: string }>();
  const { activeRoom, hydrated } = useRoomSession();
  const { cart, total, remove, setQuantity } = useCart();
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  if (!cart?.lines.length || cart.roomId !== activeRoom.id) return <Redirect href="/menu" />;
  return <ReviewPayScreen cart={cart} method={method} onBack={() => router.push('/menu' as never)} onChangeMethod={() => router.push({ pathname: '/payment-methods' as never, params: { selected: method } })} onChangeQuantity={setQuantity} onRemove={remove} total={total} />;
}

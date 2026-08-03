import { Redirect, router } from 'expo-router';

import { useCart } from '@/commerce/Cart';
import { useRoomData } from '@/rooms/RoomData';
import { MenuScreen } from '@/screens/commerce/MenuScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function MenuRoute() {
  const { activeRoom, hydrated } = useRoomSession();
  const { products, loading } = useRoomData();
  const { count } = useCart();
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  return <MenuScreen cartCount={count} loading={loading} onBack={() => router.back()} onCart={() => router.push('/review-pay' as never)} onOpenProduct={(product) => router.push({ pathname: '/item' as never, params: { id: product.id } })} products={products} roomName={activeRoom.name} />;
}

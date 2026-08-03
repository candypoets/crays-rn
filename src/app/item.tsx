import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useCart } from '@/commerce/Cart';
import { useAcceptedConversation } from '@/messages/useAcceptedConversation';
import { useRoomData } from '@/rooms/RoomData';
import { ItemScreen } from '@/screens/commerce/ItemScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function ItemRoute() {
  const { id, recipient } = useLocalSearchParams<{ id?: string; recipient?: string }>();
  const { activeRoom, hydrated } = useRoomSession();
  const { products, people } = useRoomData();
  const { add } = useCart();
  const acceptedRecipient = useAcceptedConversation(recipient);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  if (acceptedRecipient === null) return null;
  if (recipient && !acceptedRecipient) return <Redirect href={{ pathname: '/person', params: { pubkey: recipient } } as never} />;
  const product = products.find((value) => value.id === id);
  if (!product) return <Redirect href="/menu" />;
  const person = people.find((value) => value.pubkey === recipient);
  const addItem = async () => {
    setAdding(true);
    try {
      await add(activeRoom.id, activeRoom.name, product, quantity, person ? { pubkey: person.pubkey, name: person.name } : undefined);
      router.replace(person ? '/gift-review' as never : '/review-pay' as never);
    } finally {
      setAdding(false);
    }
  };
  return <ItemScreen adding={adding} onAdd={addItem} onBack={() => router.back()} onChangeQuantity={setQuantity} product={product} quantity={quantity} recipientName={person?.name} roomName={activeRoom.name} />;
}

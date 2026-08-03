import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAcceptedConversation } from '@/messages/useAcceptedConversation';
import { useRoomData } from '@/rooms/RoomData';
import { GiftSelectScreen } from '@/screens/commerce/GiftSelectScreen';
import { useRoomSession } from '@/session/RoomSession';

export default function GiftSelectRoute() {
  const { pubkey } = useLocalSearchParams<{ pubkey?: string }>();
  const { activeRoom, hydrated } = useRoomSession();
  const { people, products } = useRoomData();
  const accepted = useAcceptedConversation(pubkey);
  if (!hydrated) return null;
  if (!activeRoom) return <Redirect href="/discover" />;
  const person = people.find((value) => value.pubkey === pubkey);
  if (!person) return <Redirect href="/room" />;
  if (accepted === null) return <View className="flex-1 items-center justify-center bg-base-100"><ActivityIndicator /><Text className="mt-3 text-muted">Checking conversation consent…</Text></View>;
  if (!accepted) return <Redirect href={{ pathname: '/person', params: { pubkey: person.pubkey } } as never} />;
  const eligible = products.filter((product) => product.available && product.productKind === 'drink');
  return <GiftSelectScreen onBack={() => router.back()} onSelect={(product) => router.push({ pathname: '/item' as never, params: { id: product.id, recipient: person.pubkey } })} person={person} products={eligible} roomName={activeRoom.name} />;
}

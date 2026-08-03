// THESIS: A gifted drink is a venue order for a known person, not a cash transfer.
// OWNED WORLD: Eligible drinks appear as named bar tickets attached to the recipient.
// STORY: Confirm recipient → choose an eligible item → configure it → review the full contract.
// FIRST VIEWPORT: Recipient, non-anonymous consequence, and first eligible drinks are visible.
// FORM: No eligible item, recipient departure, decline policy, and venue restriction are explicit.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { formatCurrency } from '@/commerce/currency';
import type { RoomPerson, RoomProduct } from '@/rooms/types';
import { colors } from '@/theme/colors';

export function GiftSelectScreen({ onBack, onSelect, person, products, roomName }: { onBack: () => void; onSelect: (product: RoomProduct) => void; person: RoomPerson; products: RoomProduct[]; roomName: string }) {
  return <AppShell eyebrow={roomName} testID="gift-select-screen" title={`Send ${person.name} a drink`}><Pressable accessibilityRole="button" className="mt-1 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack}><Ionicons color={colors.accent} name="arrow-back" size={18} /><Text className="font-bold text-primary">Room profile</Text></Pressable><View className="mt-5 flex-row gap-3 rounded-[22px] border border-primary/20 bg-primary/10 p-4"><Ionicons color={colors.primary} name="person-outline" size={22} /><Text className="flex-1 text-sm leading-5 text-base-content">The gift is from you. The bar gets the order. {person.name} gets the ticket and can decline before fulfillment.</Text></View><Text accessibilityRole="header" className="mt-7 text-2xl font-black text-base-content">Eligible in this room</Text><View className="mt-4 gap-3">{products.map((product) => <Pressable className="min-h-24 flex-row items-center rounded-[22px] border border-base-300 bg-base-200 p-4" key={product.id} onPress={() => onSelect(product)} testID={`gift-product-${product.id}`}><View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><Ionicons color={colors.accent} name="wine-outline" size={28} /></View><View className="ml-4 flex-1"><Text className="text-lg font-extrabold text-base-content">{product.name}</Text><Text className="mt-1 text-sm text-muted">{product.description}</Text></View><Text className="font-black text-base-content">{formatCurrency(product.price, product.currency)}</Text></Pressable>)}</View>{!products.length ? <View className="mt-5 rounded-2xl bg-base-200 p-6"><Text className="text-center text-base leading-6 text-muted">This venue has no available drinks eligible for gifting right now.</Text></View> : null}<Text className="mt-6 text-xs leading-5 text-muted">Venue age and service checks still apply. Declining never reveals a table or precise location.</Text></AppShell>;
}

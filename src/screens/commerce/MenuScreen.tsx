// THESIS: Ordering begins with a venue-owned, section-first menu—not a marketplace.
// OWNED WORLD: Compact ticket rows make availability and price easy to scan in a room.
// STORY: Confirm venue → scan sections → choose one item → review its commitment.
// FIRST VIEWPORT: Venue, cart state, first section, and first products are visible.
// FORM: Empty, unavailable, stale-price, loading, and relay-failure states stay explicit.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppShell, SectionTitle } from '@/components/app/AppShell';
import { formatCurrency } from '@/commerce/currency';
import type { RoomProduct } from '@/rooms/types';
import { colors } from '@/theme/colors';

export function MenuScreen({ cartCount, loading, onBack, onCart, onOpenProduct, products, roomName }: {
  cartCount: number;
  loading: boolean;
  onBack: () => void;
  onCart: () => void;
  onOpenProduct: (product: RoomProduct) => void;
  products: RoomProduct[];
  roomName: string;
}) {
  const sections = products.reduce<Record<string, RoomProduct[]>>((result, product) => {
    (result[product.section] ||= []).push(product);
    return result;
  }, {});
  return (
    <AppShell
      eyebrow={roomName}
      headerAction={<Pressable accessibilityLabel={`Cart, ${cartCount} items`} className="h-12 min-w-12 flex-row items-center justify-center rounded-full bg-primary px-3" onPress={onCart} testID="menu-cart"><Ionicons color="white" name="bag-outline" size={22} />{cartCount ? <Text className="ml-1 font-black text-white">{cartCount}</Text> : null}</Pressable>}
      testID="menu-screen"
      title="Menu"
    >
      <Pressable accessibilityRole="button" className="mt-1 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack}><Ionicons color={colors.accent} name="arrow-back" size={18} /><Text className="font-bold text-primary">Back to room</Text></Pressable>
      <View className="mt-5 rounded-[24px] border border-base-300 bg-base-200 p-5">
        <Text className="text-sm font-black uppercase tracking-[2px] text-primary">Order in this room</Text>
        <Text className="mt-2 text-base leading-6 text-muted">Availability and prices come directly from {roomName}. Payment methods appear at review.</Text>
      </View>
      {loading ? <ActivityIndicator className="mt-12" color={colors.primary} /> : null}
      {!loading && !products.length ? <View className="mt-8 items-center rounded-[28px] border border-dashed border-base-300 p-8"><Ionicons color={colors.accent} name="restaurant-outline" size={34} /><Text className="mt-4 text-center text-base leading-6 text-muted">This room has not published an available menu.</Text></View> : null}
      {Object.entries(sections).map(([section, items]) => (
        <View key={section}>
          <SectionTitle>{section}</SectionTitle>
          <View className="gap-3">
            {items.map((product) => (
              <Pressable
                accessibilityRole="button"
                className={`min-h-24 flex-row items-center rounded-[22px] border border-base-300 bg-base-200 p-4 ${product.available ? '' : 'opacity-50'}`}
                disabled={!product.available}
                key={product.id}
                onPress={() => onOpenProduct(product)}
                testID={`menu-product-${product.id}`}
              >
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><Ionicons color={colors.accent} name={product.productKind === 'drink' ? 'wine-outline' : 'fast-food-outline'} size={27} /></View>
                <View className="ml-4 flex-1"><Text className="text-lg font-extrabold text-base-content">{product.name}</Text><Text numberOfLines={2} className="mt-1 text-sm leading-5 text-muted">{product.description}</Text></View>
                <Text className="ml-3 text-base font-black text-base-content">{formatCurrency(product.price, product.currency)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </AppShell>
  );
}

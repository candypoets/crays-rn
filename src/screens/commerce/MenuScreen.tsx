// THESIS: Ordering begins with a venue-owned, section-first menu—not a marketplace.
// OWNED WORLD: The room's current setlist: bright product cards with real prices.
// STORY: Confirm venue → scan sections → choose one item → review its commitment.
// FIRST VIEWPORT: Venue, tempo, cart state, first section, and first products are visible.
// FORM: Night Playlist board 03 panel 01 — empty, unavailable, stale-price, loading,
// and relay-failure states stay explicit; tapping a product only opens its detail.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppShell, SectionTitle } from '@/components/app/AppShell';
import { formatCurrency } from '@/commerce/currency';
import { DrinkImage } from '@/components/night/NightPrimitives';
import type { RoomProduct } from '@/rooms/types';
import { colors } from '@/theme/colors';

function ProductVisual({ product }: { product: RoomProduct }) {
  if (product.productKind === 'drink') {
    return (
      <DrinkImage
        className="h-24 w-full"
        index={product.position % 4}
        label={product.name}
        testID={`menu-product-image-${product.id}`}
      />
    );
  }
  return (
    <View className="h-24 w-full items-center justify-center bg-surface-soft">
      <Ionicons color={colors.inkMuted} name="fast-food-outline" size={30} />
    </View>
  );
}

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
      headerAction={
        <Pressable
          accessibilityLabel={`Cart, ${cartCount} items`}
          className="h-12 min-w-12 flex-row items-center justify-center rounded-full bg-primary px-3"
          onPress={onCart}
          testID="menu-cart"
        >
          <Ionicons color={colors.paper} name="bag-outline" size={22} />
          {cartCount ? <Text className="ml-1 font-black text-surface">{cartCount}</Text> : null}
        </Pressable>
      }
      showTempoRail
      testID="menu-screen"
      title="Menu"
    >
      <Pressable accessibilityRole="button" className="mt-1 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack}>
        <Ionicons color={colors.primary} name="arrow-back" size={18} />
        <Text className="font-bold text-primary">Back to room</Text>
      </Pressable>

      <View className="mt-4 rounded-2xl border border-edge bg-surface p-5">
        <Text className="text-sm font-black uppercase tracking-[2px] text-primary">Tonight’s setlist</Text>
        <Text className="mt-2 text-base leading-6 text-muted">
          Availability and prices come directly from {roomName}. Payment methods appear at review.
        </Text>
      </View>

      {loading ? <ActivityIndicator className="mt-12" color={colors.primary} /> : null}
      {!loading && !products.length ? (
        <View className="mt-8 items-center rounded-[28px] border border-dashed border-edge p-8">
          <Ionicons color={colors.inkMuted} name="restaurant-outline" size={34} />
          <Text className="mt-4 text-center text-base leading-6 text-muted">
            This room has not published an available menu.
          </Text>
        </View>
      ) : null}

      {!loading
        ? Object.entries(sections).map(([section, items]) => (
        <View key={section}>
          <SectionTitle>{section}</SectionTitle>
          <View className="flex-row flex-wrap gap-3">
            {items.map((product) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !product.available }}
                className={`w-[48%] overflow-hidden rounded-2xl border border-edge bg-surface ${product.available ? '' : 'opacity-50'}`}
                disabled={!product.available}
                key={product.id}
                onPress={() => onOpenProduct(product)}
                testID={`menu-product-${product.id}`}
              >
                <ProductVisual product={product} />
                <View className="p-3">
                  <Text className="text-base font-extrabold text-base-content" numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-muted" numberOfLines={2}>
                    {product.description}
                  </Text>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-base font-black text-base-content">
                      {formatCurrency(product.price, product.currency)}
                    </Text>
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                      <Ionicons color={colors.paper} name="add" size={18} />
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))
        : null}
    </AppShell>
  );
}

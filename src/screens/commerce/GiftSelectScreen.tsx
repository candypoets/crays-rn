// THESIS: A gifted drink is the next track in one venue set, never a cash transfer.
// OWNED WORLD: Recipient portrait, drink photography, and ticket-like eligible selections stay connected.
// STORY: Confirm the known recipient → choose an operator-signed drink → configure it before review.
// FIRST VIEWPORT: Recipient, non-anonymous consequence, and first eligible drinks are visible.
// FORM: Empty, departed, declined, restricted, and unavailable states remain explicit and safe.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency } from '@/commerce/currency';
import { DrinkImage, PortraitImage, TempoRail } from '@/components/night/NightPrimitives';
import type { RoomPerson, RoomProduct } from '@/rooms/types';
import { colors } from '@/theme/colors';

type GiftSelectScreenProps = {
  onBack: () => void;
  onSelect: (product: RoomProduct) => void;
  person: RoomPerson;
  products: RoomProduct[];
  roomName: string;
};

export function GiftSelectScreen({ onBack, onSelect, person, products, roomName }: GiftSelectScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'right', 'left']} testID="gift-select-screen">
      <ScrollView contentContainerClassName="grow px-5" contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} scrollIndicatorInsets={{ bottom: insets.bottom }} showsVerticalScrollIndicator={false}>
        <View className="mx-auto w-full max-w-[620px] grow">
          <View className="flex-row items-center justify-between pt-2">
            <Pressable
              accessibilityLabel="Back to room profile"
              accessibilityRole="button"
              className="h-12 w-12 items-center justify-center rounded-full border border-edge bg-surface"
              onPress={onBack}
              testID="gift-select-back"
            >
              <Ionicons color={colors.ink} name="chevron-back" size={24} />
            </Pressable>
            <Text className="text-xs font-black uppercase tracking-[0.7px] text-ink">Send a drink</Text>
            <View className="h-12 w-12" />
          </View>

          <View className="mt-5 flex-row items-start gap-4">
            <View className="min-w-0 flex-1">
              <Text accessibilityRole="header" className="text-[32px] font-black uppercase leading-[33px] tracking-[-0.8px] text-primary">
                Pick the next track
              </Text>
              <Text className="mt-1 text-base font-black uppercase text-ink">Send a drink to {person.name}</Text>
              <Text className="mt-2 text-sm text-muted">At {roomName}</Text>
            </View>
            <PortraitImage className="h-20 w-20 rounded-full border-4 border-verified" index={0} label={`Portrait of ${person.name}`} />
          </View>
          <TempoRail className="mt-5" />

          <View className="mt-5 rounded-2xl bg-surface-soft p-4">
            <Text className="text-sm leading-5 text-ink">
              The gift is from you. The bar gets the order. {person.name} gets the ticket and can decline before fulfillment.
            </Text>
          </View>

          <Text accessibilityRole="header" className="mt-7 text-xs font-black uppercase tracking-[0.7px] text-ink">Eligible in this room</Text>
          <View className="mt-3 gap-3">
            {products.map((product, index) => (
              <Pressable
                accessibilityHint="Opens drink configuration; no order is created yet"
                accessibilityRole="button"
                className="min-h-24 flex-row items-center overflow-hidden rounded-2xl border border-edge bg-surface active:border-primary"
                key={product.id}
                onPress={() => onSelect(product)}
                testID={`gift-product-${product.id}`}
              >
                <DrinkImage className="h-24 w-24" index={index} label={product.name} />
                <View className="min-w-0 flex-1 px-4 py-3">
                  <Text className="text-lg font-black text-ink">{product.name}</Text>
                  <Text numberOfLines={2} className="mt-1 text-sm text-muted">{product.description}</Text>
                  <Text className="mt-2 font-black text-primary">{formatCurrency(product.price, product.currency)}</Text>
                </View>
                <Ionicons color={colors.primary} name="chevron-forward" size={23} />
                <View className="w-3" />
              </Pressable>
            ))}
          </View>

          {!products.length ? (
            <View className="mt-5 items-center border-y border-dashed border-edge bg-surface px-6 py-10">
              <Ionicons color={colors.primary} name="wine-outline" size={34} />
              <Text className="mt-4 text-center text-base leading-6 text-muted">This venue has no available drinks eligible for gifting right now.</Text>
            </View>
          ) : null}

          <View className="mt-auto pt-6">
            <View className="flex-row gap-3 rounded-2xl bg-attention/25 p-4">
              <Ionicons color={colors.ink} name="shield-checkmark-outline" size={22} />
              <Text className="flex-1 text-xs leading-5 text-ink">Venue age and service checks still apply. Declining never reveals a table or precise location.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

const venueAtlas = require('../../../assets/night-playlist/venue-atlas.png');
const portraitAtlas = require('../../../assets/night-playlist/portrait-atlas.png');
const drinkAtlas = require('../../../assets/night-playlist/drink-atlas.png');

type AtlasCropProps = PropsWithChildren<{
  accessibilityLabel?: string;
  className?: string;
  column: number;
  columns: number;
  row: number;
  rows: number;
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function getAtlasLayout({
  column,
  columns,
  height,
  row,
  rows,
  width,
}: {
  column: number;
  columns: number;
  height: number;
  row: number;
  rows: number;
  width: number;
}) {
  if (height <= 0 || width <= 0) return null;

  // All three generated atlases are square, but their cells are not. In the
  // 4x2 portrait atlas a cell is half as wide as it is tall. Scale one source
  // cell uniformly until it covers the destination, then crop its overflow.
  const cellAspectRatio = rows / columns;
  const cellHeight = Math.max(height, width / cellAspectRatio);
  const cellWidth = cellHeight * cellAspectRatio;

  return {
    height: rows * cellHeight,
    left: -(column * cellWidth) - (cellWidth - width) / 2,
    position: 'absolute' as const,
    top: -(row * cellHeight) - (cellHeight - height) / 2,
    width: columns * cellWidth,
  };
}

function AtlasCrop({
  accessibilityLabel,
  children,
  className = '',
  column,
  columns,
  row,
  rows,
  source,
  style,
  testID,
}: AtlasCropProps) {
  const [layout, setLayout] = useState({ height: 0, width: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    if (height !== layout.height || width !== layout.width) setLayout({ height, width });
  };
  const imageStyle = getAtlasLayout({ column, columns, height: layout.height, row, rows, width: layout.width });

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
      className={`overflow-hidden bg-surface-soft ${className}`}
      onLayout={onLayout}
      style={style}
      testID={testID}
    >
      {imageStyle ? (
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={source}
          style={imageStyle}
          testID={testID ? `${testID}-image` : undefined}
        />
      ) : null}
      {children}
    </View>
  );
}

export function VenueImage({
  className = '',
  index = 0,
  label,
  testID,
}: {
  className?: string;
  index?: number;
  label?: string;
  testID?: string;
}) {
  const safeIndex = Math.max(0, Math.min(3, index));
  return (
    <AtlasCrop
      accessibilityLabel={label}
      className={className}
      column={safeIndex % 2}
      columns={2}
      row={Math.floor(safeIndex / 2)}
      rows={2}
      source={venueAtlas}
      testID={testID}
    />
  );
}

export function PortraitImage({
  className = '',
  identity,
  index,
  label,
  picture,
  style,
  testID,
}: {
  className?: string;
  identity?: string;
  index?: number;
  label?: string;
  picture?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const [failedPicture, setFailedPicture] = useState<string | null>(null);
  const pictureUri = /^https?:\/\/\S+$/i.test(picture?.trim() ?? '') ? picture?.trim() : undefined;
  if (pictureUri && failedPicture !== pictureUri) {
    return (
      <View
        accessibilityLabel={label}
        accessible={Boolean(label)}
        className={`overflow-hidden bg-surface-soft ${className}`}
        style={style}
        testID={testID}
      >
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          className="h-full w-full"
          onError={() => setFailedPicture(pictureUri)}
          resizeMode="cover"
          source={{ uri: pictureUri }}
          testID={testID ? `${testID}-profile-image` : undefined}
        />
      </View>
    );
  }

  const safeIndex = index === undefined
    ? stablePortraitIndex(identity ?? '')
    : Math.max(0, Math.min(7, index));
  return (
    <AtlasCrop
      accessibilityLabel={label}
      className={className}
      column={safeIndex % 4}
      columns={4}
      row={Math.floor(safeIndex / 4)}
      rows={2}
      source={portraitAtlas}
      style={style}
      testID={testID}
    />
  );
}

export function stablePortraitIndex(identity: string): number {
  let hash = 0x811c9dc5;
  for (const character of identity) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 8;
}

export function DrinkImage({
  className = '',
  index = 0,
  label,
  testID,
}: {
  className?: string;
  index?: number;
  label?: string;
  testID?: string;
}) {
  const safeIndex = Math.max(0, Math.min(3, index));
  return (
    <AtlasCrop
      accessibilityLabel={label}
      className={className}
      column={safeIndex % 2}
      columns={2}
      row={Math.floor(safeIndex / 2)}
      rows={2}
      source={drinkAtlas}
      testID={testID}
    />
  );
}

export function EdgeTabs({ testID, top = 88 }: { testID?: string; top?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.edgeTabs, { top }]}
      testID={testID}
    >
      <View className="h-14 w-8 rounded-l-2xl bg-commitment" />
      <View className="h-14 w-8 rounded-l-2xl bg-verified" />
      <View className="h-14 w-8 rounded-l-2xl bg-attention" />
    </View>
  );
}

export function TempoRail({ className = '', testID }: { className?: string; testID?: string }) {
  return (
    <View
      accessibilityElementsHidden
      className={`h-1 flex-row overflow-hidden rounded-full ${className}`}
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    >
      <View className="flex-[4] bg-primary" />
      <View className="flex-[2] bg-commitment" />
      <View className="flex-[1.5] bg-verified" />
      <View className="flex-1 bg-attention" />
    </View>
  );
}

type BadgeTone = 'attention' | 'commitment' | 'error' | 'neutral' | 'primary' | 'verified';

const badgeClasses: Record<BadgeTone, string> = {
  attention: 'bg-attention text-ink',
  commitment: 'bg-commitment text-ink',
  error: 'bg-error text-white',
  neutral: 'bg-surface-soft text-ink',
  primary: 'bg-primary text-white',
  verified: 'bg-verified text-ink',
};

export function NightBadge({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: BadgeTone }>) {
  const [backgroundClass, textClass] = badgeClasses[tone].split(' ');
  return (
    <View className={`min-h-7 self-start justify-center rounded-full px-3 py-1 ${backgroundClass}`}>
      <Text className={`text-xs font-extrabold ${textClass}`}>{children}</Text>
    </View>
  );
}

export function NightCard({
  children,
  className = '',
  onPress,
  testID,
}: PropsWithChildren<{ className?: string; onPress?: () => void; testID?: string }>) {
  const Component = onPress ? Pressable : View;
  return (
    <Component
      accessibilityRole={onPress ? 'button' : undefined}
      className={`rounded-2xl border border-edge bg-surface p-4 ${className}`}
      onPress={onPress}
      testID={testID}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  edgeTabs: {
    gap: 6,
    position: 'absolute',
    right: -8,
    zIndex: 10,
  },
});

export const nightImageSources = { drinkAtlas, portraitAtlas, venueAtlas } as const;

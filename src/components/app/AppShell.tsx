import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EdgeTabs, TempoRail } from '@/components/night/NightPrimitives';
import { BrandMark } from '@/components/onboarding/OnboardingPrimitives';

type AppShellProps = PropsWithChildren<{
  chrome?: 'brand' | 'child';
  title?: string;
  eyebrow?: string;
  headerAction?: ReactNode;
  showEdgeTabs?: boolean;
  showTempoRail?: boolean;
  scroll?: boolean;
  testID: string;
  underTabBar?: boolean;
}>;

export function AppShell({ children, chrome = 'brand', eyebrow, headerAction, scroll = true, showEdgeTabs = false, showTempoRail = false, testID, title, underTabBar = false }: AppShellProps) {
  const insets = useSafeAreaInsets();
  // The bottom tab bar already owns the home-indicator inset; everywhere else
  // the scroll content pads so the last row can rest above it.
  const bottomInset = underTabBar ? 0 : insets.bottom;
  // The fixed brand header claims the top inset; child chrome scrolls through it.
  const topInset = chrome === 'brand' ? 0 : insets.top;
  const content = <View className="mx-auto w-full max-w-[620px] grow px-5" style={{ paddingTop: topInset, paddingBottom: 32 + bottomInset }}>{children}</View>;
  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={['right', 'left']} testID={testID}>
      {showEdgeTabs ? <EdgeTabs top={96} /> : null}
      {chrome === 'brand' ? (
        <View className="mx-auto w-full max-w-[620px] flex-row items-center justify-between px-5 pb-3" style={{ paddingTop: 8 + insets.top }} testID={`${testID}-brand-header`}>
          <View className="flex-1 flex-row items-center gap-3">
            <BrandMark size={42} />
            <View className="flex-1">
              {eyebrow ? <Text className="text-xs font-bold tracking-[0.7px] text-primary">{eyebrow}</Text> : null}
              {title ? <Text accessibilityRole="header" className="text-[28px] font-extrabold tracking-[-0.5px] text-base-content">{title}</Text> : null}
            </View>
          </View>
          {headerAction}
        </View>
      ) : null}
      {showTempoRail ? <TempoRail className="mx-5 mb-2 opacity-90" /> : null}
      {scroll ? (
        <ScrollView contentContainerClassName="grow" scrollIndicatorInsets={{ top: topInset, bottom: bottomInset }} showsVerticalScrollIndicator={false}>{content}</ScrollView>
      ) : content}
    </SafeAreaView>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text accessibilityRole="header" className="mb-3 mt-7 text-[22px] font-extrabold tracking-[-0.25px] text-base-content">{children}</Text>;
}

export function RaisedRow({ children, onPress, testID }: PropsWithChildren<{ onPress?: () => void; testID?: string }>) {
  const Component = onPress ? Pressable : View;
  return (
    <Component className="min-h-16 flex-row items-center rounded-2xl border border-edge bg-surface px-4 py-3" onPress={onPress} testID={testID}>
      {children}
    </Component>
  );
}

import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
}>;

export function AppShell({ children, chrome = 'brand', eyebrow, headerAction, scroll = true, showEdgeTabs = false, showTempoRail = false, testID, title }: AppShellProps) {
  const content = <View className="mx-auto w-full max-w-[620px] grow px-5 pb-8">{children}</View>;
  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={['top', 'right', 'bottom', 'left']} testID={testID}>
      {showEdgeTabs ? <EdgeTabs top={96} /> : null}
      {chrome === 'brand' ? (
        <View className="mx-auto w-full max-w-[620px] flex-row items-center justify-between px-5 pb-3 pt-2" testID={`${testID}-brand-header`}>
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
        <ScrollView contentContainerClassName="grow" showsVerticalScrollIndicator={false}>{content}</ScrollView>
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

import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

type AppShellProps = PropsWithChildren<{
  title?: string;
  eyebrow?: string;
  headerAction?: ReactNode;
  scroll?: boolean;
  testID: string;
}>;

const tabs = [
  { href: '/room', label: 'Room', icon: 'radio-outline' },
  { href: '/discover', label: 'Discover', icon: 'compass-outline' },
  { href: '/messages', label: 'Messages', icon: 'chatbubbles-outline' },
  { href: '/me', label: 'Me', icon: 'person-circle-outline' },
] as const;

export function AppShell({ children, eyebrow, headerAction, scroll = true, testID, title }: AppShellProps) {
  const pathname = usePathname();
  const content = <View className="mx-auto w-full max-w-[620px] grow px-5 pb-8">{children}</View>;
  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={['top', 'right', 'bottom', 'left']} testID={testID}>
      <View className="mx-auto w-full max-w-[620px] flex-row items-center justify-between px-5 pb-3 pt-2">
        <View className="flex-1 flex-row items-center gap-3">
          <BrandMark size={42} />
          <View className="flex-1">
            {eyebrow ? <Text className="text-xs font-bold uppercase tracking-[2px] text-primary">{eyebrow}</Text> : null}
            {title ? <Text accessibilityRole="header" className="text-2xl font-extrabold text-base-content">{title}</Text> : null}
          </View>
        </View>
        {headerAction}
      </View>
      {scroll ? (
        <ScrollView contentContainerClassName="grow" showsVerticalScrollIndicator={false}>{content}</ScrollView>
      ) : content}
      <View className="border-t border-base-300 bg-base-100 px-2 pb-1 pt-2">
        <View className="mx-auto w-full max-w-[620px] flex-row">
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                className="min-h-14 flex-1 items-center justify-center"
                key={tab.href}
                onPress={() => router.replace(tab.href as never)}
                testID={`tab-${tab.label.toLowerCase()}`}
              >
                <Ionicons color={active ? colors.primary : colors.navMuted} name={tab.icon} size={25} />
                <Text className={`mt-1 text-xs font-semibold ${active ? 'text-primary' : 'text-muted'}`}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text accessibilityRole="header" className="mb-3 mt-7 text-2xl font-extrabold text-base-content">{children}</Text>;
}

export function RaisedRow({ children, onPress, testID }: PropsWithChildren<{ onPress?: () => void; testID?: string }>) {
  const Component = onPress ? Pressable : View;
  return (
    <Component className="min-h-16 flex-row items-center rounded-2xl border border-base-300 bg-base-200 px-4 py-3" onPress={onPress} testID={testID}>
      {children}
    </Component>
  );
}

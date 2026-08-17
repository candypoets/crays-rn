import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRIMARY_TABS, primaryTabBarStyle, primaryTabIcon } from '@/navigation/primaryTabs';
import { colors } from '@/theme/colors';

function optionsFor(tab: (typeof PRIMARY_TABS)[number]) {
  return {
    tabBarAccessibilityLabel: tab.title,
    tabBarButtonTestID: tab.testID,
    tabBarIcon: ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
      <Ionicons
        color={color}
        name={primaryTabIcon(tab.name, focused)}
        size={size}
      />
    ),
    title: tab.title,
  };
}

export default function PrimaryTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      backBehavior="initialRoute"
      initialRouteName="room"
      screenOptions={{
        animation: 'fade',
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: colors.primary,
        tabBarHideOnKeyboard: false,
        tabBarInactiveTintColor: colors.navMuted,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.edge,
          ...primaryTabBarStyle(insets.bottom),
        },
        transitionSpec: { animation: 'timing', config: { duration: 280 } },
      }}
    >
      <Tabs.Screen name="room" options={optionsFor(PRIMARY_TABS[0])} />
      <Tabs.Screen name="discover" options={optionsFor(PRIMARY_TABS[1])} />
      <Tabs.Screen name="messages" options={optionsFor(PRIMARY_TABS[2])} />
      <Tabs.Screen name="me" options={optionsFor(PRIMARY_TABS[3])} />
    </Tabs>
  );
}

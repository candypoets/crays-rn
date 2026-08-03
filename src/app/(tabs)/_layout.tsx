import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { PRIMARY_TABS, primaryTabIcon } from '@/navigation/primaryTabs';
import { colors } from '@/theme/colors';

export default function PrimaryTabsLayout() {
  return (
    <Tabs
      backBehavior="initialRoute"
      initialRouteName="room"
      screenOptions={{
        animation: 'none',
        headerShown: false,
        sceneStyle: { backgroundColor: colors.night },
        tabBarActiveTintColor: colors.primary,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: colors.navMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.night,
          borderTopColor: colors.nightBorder,
        },
      }}
    >
      {PRIMARY_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarAccessibilityLabel: tab.title,
            tabBarButtonTestID: tab.testID,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                color={color}
                name={primaryTabIcon(tab.name, focused)}
                size={size}
              />
            ),
            title: tab.title,
          }}
        />
      ))}
    </Tabs>
  );
}

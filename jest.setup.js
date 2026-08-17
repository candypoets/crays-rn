jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => React.createElement(Text, { accessibilityElementsHidden: true }, name),
  };
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    Easing: { cubic: (value) => value, out: (easing) => easing },
    useAnimatedStyle: (factory) => factory(),
    useReducedMotion: () => true,
    useSharedValue: (value) => ({ value }),
    withTiming: (value) => value,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };

  return {
    ...actual,
    initialWindowMetrics: { frame: { height: 640, width: 320, x: 0, y: 0 }, insets },
    useSafeAreaInsets: jest.fn(() => insets),
  };
});

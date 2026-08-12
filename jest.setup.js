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

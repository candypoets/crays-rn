module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/maestro/', '/android/', '/ios/'],
  // @candypoets/nipworker and its noble/scure/nostr-tools deps ship ESM; let
  // babel transform them like the RN/Expo packages.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@candypoets|@noble|@scure|nostr-tools)',
  ],
};

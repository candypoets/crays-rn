const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['android/**', 'ios/**', 'coverage/**', '.expo/**'],
  },
  {
    // Jest setup runs in the Jest environment, unlike app code.
    files: ['jest.setup.js'],
    languageOptions: { globals: { jest: 'readonly' } },
  },
  {
    // .qa scripts are plain Node.mjs harness code, not React Native app code.
    files: ['.qa/**/*.mjs'],
    languageOptions: { globals: { Buffer: 'readonly' } },
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
]);

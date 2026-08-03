const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['android/**', 'ios/**', 'coverage/**', '.expo/**'],
  },
  {
    // .qa scripts are plain Node.mjs harness code, not React Native app code.
    files: ['.qa/**/*.mjs'],
    languageOptions: { globals: { Buffer: 'readonly' } },
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
]);

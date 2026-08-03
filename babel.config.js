module.exports = function babelConfig(api) {
  const isTest = api.env('test');

  return {
    presets: isTest
      ? ['babel-preset-expo']
      : [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};

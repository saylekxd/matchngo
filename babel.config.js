module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ... any existing plugins ...
      'react-native-reanimated/plugin',
    ],
  };
}; 
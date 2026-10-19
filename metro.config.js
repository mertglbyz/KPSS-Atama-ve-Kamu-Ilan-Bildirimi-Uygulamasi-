const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });
const previousResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-purchases') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'shims/react-native-purchases.web.js'),
    };
  }
  if (platform === 'web' && moduleName === 'react-native-purchases-ui') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'shims/react-native-purchases-ui.web.js'),
    };
  }
  if (previousResolve) {
    return previousResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

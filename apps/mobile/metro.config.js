const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure for pnpm monorepo
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Fix for pnpm dependency resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable symlinks for pnpm
config.resolver.unstable_enableSymlinks = true;

module.exports = withNativeWind(config, { input: './global.css' });

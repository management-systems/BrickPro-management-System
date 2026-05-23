const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure Metro looks in the correct node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Force CJS resolution - remove mjs from source extensions to avoid import.meta issues
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mjs');

// Disable package exports to avoid resolution warnings with some libraries
config.resolver.unstable_enablePackageExports = false;

// Watch only the mobile app directory
config.watchFolders = [__dirname];

module.exports = config;

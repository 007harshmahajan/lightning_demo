const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  // Add fallbacks for node modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "buffer": require.resolve("buffer/"),
    "assert": require.resolve("assert/"),
    "stream": require.resolve("stream-browserify"),
    "url": require.resolve("url/"),
    "querystring": require.resolve("querystring-es3"),
    "path": require.resolve("path-browserify"),
    "util": require.resolve("util/"),
    "vm": require.resolve("vm-browserify"),
    "fs": false,  // fs module can't be polyfilled in browser
  };

  // Add buffer plugins
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    // Ignore the problematic WASM file
    new webpack.IgnorePlugin({
      resourceRegExp: /wasmer_wasi_js_bg\.wasm$/,
    }),
  ];

  // Add WASM support
  config.resolve.extensions.push('.wasm');
  config.module.rules.forEach(rule => {
    (rule.oneOf || []).forEach(oneOf => {
      if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
        oneOf.exclude.push(/\.wasm$/);
      }
    });
  });

  // Add a specific rule for WASM files
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'javascript/auto',
    loader: 'file-loader',
    options: {
      name: 'static/wasm/[name].[hash:8].[ext]',
    },
  });

  // Skip the WASM file that's causing issues
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Critical dependency: the request of a dependency is an expression/,
  ];
  
  return config;
}; 
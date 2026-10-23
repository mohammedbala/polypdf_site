'use strict';
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const build = path.resolve(__dirname, '..', process.env.BUILD_PATH || 'build');
webpack({
  mode: 'production',
  entry: path.resolve(__dirname, '../src/lib/localizedTracking.js'),
  output: { path: path.join(build, 'static/js'), filename: 'localized-tracking.[contenthash:8].js' },
  module: { rules: [{ test: /\.js$/, exclude: /node_modules/, use: {
    loader: require.resolve('babel-loader'),
    options: { presets: [[require.resolve('babel-preset-react-app'), { runtime: 'automatic' }]], babelrc: false, configFile: false }
  } }] },
  devtool: false
}, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err || stats.toString({ all: false, errors: true }));
    process.exitCode = 1;
    return;
  }
  const asset = stats.toJson({ all: false, assets: true }).assets.find(item => /^localized-tracking\.[a-f0-9]+\.js$/.test(item.name));
  fs.writeFileSync(path.join(build, 'localized-tracking-manifest.json'), JSON.stringify({ src: `/static/js/${asset.name}` }) + '\n');
  console.log(`Built localized consent bundle: ${asset.name} (${asset.size} bytes).`);
});

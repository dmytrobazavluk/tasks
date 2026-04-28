const esbuild = require('esbuild');
const { mkdirSync, copyFileSync } = require('fs');

function prepareDist() {
  mkdirSync('dist', { recursive: true });
  copyFileSync('index.html', 'dist/index.html');
}

function getBuildConfig() {
  return {
    entryPoints: ['src/main.jsx'],
    bundle: true,
    outfile: 'dist/bundle.js',
    format: 'iife',
    minify: false,
    sourcemap: true,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
    },
    jsx: 'automatic',
    jsxImportSource: 'react',
  };
}

function build() {
  prepareDist();
  esbuild.buildSync(getBuildConfig());
  return getBuildConfig();
}

module.exports = { build };

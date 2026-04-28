const esbuild = require('esbuild');
const { mkdirSync, copyFileSync } = require('fs');

// Ensure dist directory exists
mkdirSync('dist', { recursive: true });

esbuild
  .build({
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
  })
  .then(() => {
    copyFileSync('index.html', 'dist/index.html');
    console.log('Build complete!');
  })
  .catch(() => process.exit(1));

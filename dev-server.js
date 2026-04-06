const esbuild = require('esbuild');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Initial build
console.log('Building...');
esbuild.buildSync({
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
});
console.log('Build complete!');

// Watch for changes
esbuild
  .context({
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
  .then((context) => {
    context.watch().then(() => {
      console.log('Watching for changes...');
    });
  });

// Simple HTTP server
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Try to read the file
  try {
    if (fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

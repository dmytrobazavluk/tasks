const { build } = require('./build-utils');

try {
  build();
  console.log('Build complete!');
} catch (err) {
  process.exit(1);
}

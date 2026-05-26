// Stamps dist/sw.js with a content-derived cache version so each release
// invalidates stale caches. Runs after `vite build` (see package.json).
// The version is a hash of the built asset filenames (which already encode
// Vite content hashes) plus index.html, so it only changes when output does.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dist = path.join(__dirname, '..', 'dist');
const swPath = path.join(dist, 'sw.js');

if (!fs.existsSync(swPath)) {
  console.warn('[postbuild-sw] dist/sw.js not found; skipping');
  process.exit(0);
}

const hash = crypto.createHash('sha256');
const assetsDir = path.join(dist, 'assets');
if (fs.existsSync(assetsDir)) {
  for (const name of fs.readdirSync(assetsDir).sort()) hash.update(name);
}
const indexPath = path.join(dist, 'index.html');
if (fs.existsSync(indexPath)) hash.update(fs.readFileSync(indexPath));
const version = hash.digest('hex').slice(0, 8);

const sw = fs.readFileSync(swPath, 'utf8');
if (!sw.includes('__SW_VERSION__')) {
  console.warn('[postbuild-sw] no __SW_VERSION__ placeholder in dist/sw.js; left unchanged');
  process.exit(0);
}
fs.writeFileSync(swPath, sw.replace(/__SW_VERSION__/g, version));
console.log('[postbuild-sw] stamped cache version:', version);

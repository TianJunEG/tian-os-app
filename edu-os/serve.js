// serve.js — a tiny, dependency-free static server so `npm start` just works.
// Education OS is a static front end (vanilla ES modules); this only exists to serve
// the right MIME types. Swap for any static host, or front it with the Tutor Match API.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const MATHPATH = join(ROOT, '..', 'mathpath'); // served same-origin under /mathpath so the two apps share storage
const PORT = process.env.PORT || 8090;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let rel = normalize(url).replace(/^(\.\.[/\\])+/, ''); // block path traversal
    if (rel === '/' || rel === '\\') rel = '/index.html';
    let file;
    if (rel === '/mathpath' || rel.startsWith('/mathpath/')) {
      const sub = rel.replace(/^\/mathpath\/?/, '') || 'index.html';
      file = join(MATHPATH, sub);
      if (!file.startsWith(MATHPATH)) { res.writeHead(403); res.end('Forbidden'); return; }
    } else {
      file = join(ROOT, rel);
      if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Education OS running →  http://localhost:${PORT}`);
});

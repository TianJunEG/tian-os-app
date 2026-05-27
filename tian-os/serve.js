// serve.js — a tiny, dependency-free static server so `npm start` just works.
// Tian OS is a static front end (vanilla ES modules); this only exists to serve
// the right MIME types. Swap for any static host, or front it with the Tutor Match API.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
// Companion learning apps served same-origin (under /<app>/) so they share the learning event
// log. Drop a sibling folder named like these and it mounts automatically.
const APPS = new Set(['mathpath', 'spelling', 'science']);
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
    const app = rel.split('/')[1];
    if (APPS.has(app)) {
      const base = join(ROOT, '..', app);
      const sub = rel.slice(app.length + 1).replace(/^\//, '') || 'index.html';
      file = join(base, sub);
      if (!file.startsWith(base)) { res.writeHead(403); res.end('Forbidden'); return; }
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
  console.log(`Tian OS running →  http://localhost:${PORT}`);
});

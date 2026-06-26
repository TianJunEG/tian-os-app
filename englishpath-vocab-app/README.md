# Vocabulary Builder — standalone web app

A self-contained web app for Primary 6 (PSLE) English **vocabulary** practice.
Adaptive ladder (meet → meaning → synonym → nuance → exam form) + spaced
repetition over ~406 words mined from real prelim papers.

**No framework. No build step. No backend.** It's three files
(`index.html`, `styles.css`, `app.js`) plus the shared vocabulary engine, which
is imported directly as an ES module. Progress is stored in `localStorage`.

This is independent of Tian OS — it reuses only the engine in
`shared/englishpath/vocabulary/` (pure JS, no React/auth/server).

## Run locally

Serve from the **repo root** (so the `../shared/...` import resolves):

```bash
# from the repo root
python3 -m http.server 4178
# then open http://localhost:4178/englishpath-vocab-app/index.html
```

## Deploy as a fully separate static site

The engine is the only external dependency. Two options:

1. **Bundle it in** (recommended — one self-contained file, host anywhere):
   ```bash
   cd englishpath-vocab-app
   npx esbuild app.js --bundle --format=esm --outfile=dist/app.bundle.js
   # point index.html's <script src> at ./dist/app.bundle.js, then upload
   # index.html + styles.css + dist/ to Netlify / Vercel / GitHub Pages / S3.
   ```

2. **Copy the engine alongside**: copy `shared/englishpath/vocabulary/` into this
   folder and change the import in `app.js` to the local path.

Either way the result is a pure static site — no server, no database.

## Updating the word bank

The word bank lives in the shared engine
(`shared/englishpath/vocabulary/`). Regenerate `harvestedEntries.js` via the
harvest pipeline; this app and the Tian OS module both pick up the change.

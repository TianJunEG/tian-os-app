# Vocabulary Builder — standalone lead-gen web app

A self-contained web app for Primary 5 & 6 (Singapore) English **vocabulary**
practice. Adaptive ladder (meet → meaning → synonym → nuance → exam form) +
spaced repetition over **712 words** (P6 406, P5 306) mined from real exam papers.

**No framework. No build step. No backend.** Three files (`index.html`,
`styles.css`, `app.js`) + a `config.js`, plus the shared vocabulary engine in
`shared/englishpath/vocabulary/` (pure JS — no React/auth/server). Progress is
stored in `localStorage`.

## The funnel (lead-gen)

- **Free / anonymous:** practise any number of sessions, P5 or P6 — but nothing
  is saved (top-of-funnel taste).
- **The gate:** when they want progress remembered, a paywall modal captures
  their **email + child's level** (the lead) and sends them to checkout.
- **Premium:** saved progress + spaced review + readiness tracking.

## Run locally

Serve from the **repo root** (so the `../shared/...` import resolves):

```bash
python3 -m http.server 4178
# open http://localhost:4178/englishpath-vocab-app/index.html
```

With no config set it runs in demo mode: the lead is logged to the console and
Premium unlocks instantly so you can click through the whole flow.

## Go live (three one-time steps)

1. **Lead capture** — edit `config.js`, set `LEAD_ENDPOINT` to a form/CRM
   endpoint that accepts a POST (Formspree, Web3Forms, a Zapier/Make webhook, or
   your own). The app POSTs `{ email, level, source, app, at }` there.
2. **Payment** — set `STRIPE_PAYMENT_LINK` to a Stripe Payment Link. In Stripe,
   set that link's after-payment redirect to your site URL with `?unlocked=1`
   appended (e.g. `https://yoursite/?unlocked=1`); the app grants Premium when
   the customer returns. (Static-site gating trusts that redirect — fine for a
   freemium funnel; add a backend later if you need hard enforcement.)
3. **Hosting** — repo **Settings → Pages → Source: "GitHub Actions"**, then
   **Actions tab → "Deploy Vocab Builder" → Run workflow**. It bundles the app
   (inlining the engine into one minified file) and publishes it at
   `https://<org>.github.io/<repo>/`. The workflow is manual-trigger only so
   merging never leaves a failing run before Pages is on; flip it to
   auto-deploy-on-push afterwards (snippet in the workflow file).

### Deploy elsewhere instead

Bundle to a portable static folder and upload anywhere (Netlify, Vercel, S3):

```bash
mkdir -p dist && cp englishpath-vocab-app/index.html englishpath-vocab-app/styles.css dist/
npx esbuild englishpath-vocab-app/app.js --bundle --format=esm --minify --outfile=dist/app.js
# upload dist/  (On Netlify you can use Netlify Forms instead of LEAD_ENDPOINT.)
```

## Updating the word bank

The bank lives in the shared engine (`shared/englishpath/vocabulary/`).
Regenerate `harvestedEntries.js` via the harvest pipeline; this app and the
Tian OS in-app module both pick up the change.

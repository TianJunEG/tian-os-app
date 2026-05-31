# Tian OS Pilot Deployment (Vercel + Render + MongoDB Atlas)

This guide prepares a 5-student pilot deployment with:

- Frontend: Vercel (Vite app in `frontend/`)
- Backend API: Render (`server.js`)
- Database: MongoDB Atlas

No deployment is triggered by this document.

## 1) Frontend (Vercel) settings

Project setup:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment Variables (Vercel):

- `VITE_API_URL=https://<your-render-service>.onrender.com/api`
- `VITE_STRIPE_PUBLISHABLE_KEY=<publishable_key>`
- `VITE_ENABLE_WORKSHEETS=false` (or true if intentionally enabled)
- `VITE_PLAUSIBLE_DOMAIN=<optional>`
- `VITE_PLAUSIBLE_SRC=<optional>`

## 2) Backend (Render) settings

Service type: `Web Service` (Node)

- Root Directory: repository root
- Build Command: `npm ci`
- Start Command: `npm start`

Health check:

- Primary: `/api/health`
- Alternate: `/healthz`

Environment Variables (Render):

- `NODE_ENV=production`
- `PORT` (set by Render automatically)
- `MONGODB_URI=<atlas_connection_string>`
- `JWT_SECRET=<strong_random_secret>`
- `JWT_EXPIRE=7d`
- `CORS_ORIGIN=https://<your-vercel-domain>`
- `FRONTEND_URL=https://<your-vercel-domain>`
- `STRIPE_SECRET_KEY=<secret_key>`
- `STRIPE_PUBLIC_KEY=<publishable_key>`
- `STRIPE_WEBHOOK_SECRET=<webhook_secret>`
- `EMAIL_SERVICE=<provider>`
- `EMAIL_USER=<email_user>`
- `EMAIL_PASSWORD=<email_password>`
- `EMAIL_FROM=<from_email>`
- `PARTNERSHIPS_NOTIFICATION_EMAIL=<ops_email>`

Optional migration flags (keep defaults for pilot):

- `DB_READ_SOURCE=mongo`
- `DB_DUAL_WRITE=false`
- `DB_PARITY_LOG=false`

## 3) MongoDB Atlas requirements

Atlas checklist:

1. Create a project + cluster.
2. Create application user with read/write access.
3. Network access: allow Render egress (or temporary `0.0.0.0/0` during setup).
4. Copy URI into `MONGODB_URI`.

## 4) CORS notes

Backend CORS now accepts:

- explicit URLs from `CORS_ORIGIN` (comma-separated)
- optional `FRONTEND_URL`
- Vercel preview domains matching `*.vercel.app`

For strict production:

- keep `CORS_ORIGIN` limited to your official Vercel domain
- keep preview allowance only if your release process needs it

## 5) Seed commands (run after backend is live)

From repository root:

```bash
npm run seed:foundation
npm run seed:domains
npm run seed:test-accounts
npm run seed:fractions-alpha-pack
```

Optional pilot checks:

```bash
npm run qa:pilot:preflight
npm run qa:fractions:closure
```

## 6) Deployment order

1. Provision MongoDB Atlas and get URI.
2. Create Render backend service, set env vars, verify `/api/health`.
3. Create Vercel frontend project, set `VITE_API_URL`.
4. Update backend `CORS_ORIGIN` to the exact Vercel production URL.
5. Run seed commands.
6. Run pilot QA checks.

## 7) Smoke test commands

Backend:

```bash
curl https://<your-render-service>.onrender.com/api/health
curl https://<your-render-service>.onrender.com/healthz
```

Frontend:

- Open `https://<your-vercel-domain>`
- Login with seeded pilot accounts
- Open MathPath and verify first student flow


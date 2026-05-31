# Tian OS Pilot Deployment Guide

Target topology:

- Frontend: Vercel
- Backend API: Render
- Database: MongoDB Atlas

This guide prepares deployment configuration only. It does not deploy.

## 1) Repo audit checklist (current)

1. Frontend build command: `npm run build` in `frontend/package.json`
2. Backend start command: `npm start` (`node server.js`) in root `package.json`
3. Backend health routes: `/api/health` and `/healthz` in `server.js`
4. Frontend API env: `VITE_API_URL` in `frontend/.env.example`
5. Backend CORS: `CORS_ORIGIN` + `FRONTEND_URL` in `server.js`
6. Atlas env var: `MONGODB_URI` (optional fallback `MONGODB_URI_LOCAL`)
7. JWT secrets: `JWT_SECRET`, `JWT_EXPIRE`
8. Upload handling: `app.use('/uploads', express.static('uploads'))` + Render persistent disk
9. Pilot seeding scripts: `seed:foundation`, `seed:domains`, `seed:test-accounts`, `seed:fractions-alpha-pack`
10. Post-deploy QA: `qa:pilot:preflight`, `qa:fractions:closure`, optional `qa:pilot`

## 2) Vercel settings (frontend)

Repository settings:

- Framework preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Vercel env vars:

- `VITE_API_URL=https://<render-service>.onrender.com/api`
- `VITE_STRIPE_PUBLISHABLE_KEY=<publishable_key>`
- `VITE_ENABLE_WORKSHEETS=false` (or intentional value)
- `VITE_PLAUSIBLE_DOMAIN=<optional>`
- `VITE_PLAUSIBLE_SRC=<optional>`

Routing:

- `frontend/vercel.json` includes SPA rewrite to `/index.html`.

## 3) Render settings (backend)

Use `render.yaml` (backend-only blueprint).

Service settings:

- Runtime: Node
- Root Directory: repo root
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Persistent disk:

- Mount path: `/opt/render/project/src/uploads`
- Size: `1 GB` (starter baseline)

Render env vars:

- `NODE_ENV=production`
- `MONGODB_URI=<atlas_uri>`
- `JWT_SECRET=<strong_secret>`
- `JWT_EXPIRE=7d`
- `CORS_ORIGIN=https://<your-vercel-domain>,https://<preview.vercel.app>`
- `FRONTEND_URL=https://<your-vercel-domain>`
- `STRIPE_SECRET_KEY=<secret_key>`
- `STRIPE_PUBLIC_KEY=<publishable_key>`
- `STRIPE_WEBHOOK_SECRET=<webhook_secret>`
- `EMAIL_SERVICE=<provider>`
- `EMAIL_USER=<email_user>`
- `EMAIL_PASSWORD=<email_password>`
- `EMAIL_FROM=<from_email>`
- `PARTNERSHIPS_NOTIFICATION_EMAIL=<ops_email>`

## 4) MongoDB Atlas settings

Atlas checklist:

1. Create cluster and database user.
2. Add network access for Render egress (temporary `0.0.0.0/0` if needed during setup).
3. Put connection string in Render `MONGODB_URI`.

## 5) Post-deploy seed commands

Run from repo root against deployed backend DB settings:

```bash
npm run seed:foundation
npm run seed:domains
npm run seed:test-accounts
npm run seed:fractions-alpha-pack
```

## 6) Post-deploy QA commands

```bash
npm run qa:pilot:preflight
npm run qa:fractions:closure
```

Optional full gate:

```bash
npm run qa:pilot
```

## 7) Operational notes

- If logins fail with HTTP 429, pause and rerun after auth rate-limit window.
- Keep `CORS_ORIGIN` explicit; avoid wildcard for production.
- Ensure upload disk is attached before testing working upload.
- Keep MongoDB Atlas credentials out of git; use only platform env settings.

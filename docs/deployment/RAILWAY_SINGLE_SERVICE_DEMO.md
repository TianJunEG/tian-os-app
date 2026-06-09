# Tian OS — Single-Service Railway Demo Setup

Goal: one Railway service serves **both** the app (frontend) and the API
(backend) from a single URL, ready to demo to distribution / channel partners.

This replaces the older "Vercel frontend + Railway backend" split. You no
longer need Vercel.

---

## What changed in the code (already done)

| File | Change | Why |
|---|---|---|
| `server.js` | Serves the built React app from `frontend/dist` and falls back to `index.html` for app routes. API, `/uploads`, and health routes still take precedence. | So one service serves the whole app. |
| `frontend/src/services/api.js` | When the app is opened on a real domain (not localhost), it auto-calls the API at the same origin (`/api`). | No backend URL to hardcode — the app just works wherever it's deployed. |
| `package.json` | Build now runs `npm install --prefix frontend --include=dev` before building. | Forces install of `vite` and other build tools (they live in *devDependencies*). **This is the most likely reason earlier deploys failed** — production installs skip devDependencies, so `vite` was missing and the build died. |
| `railway.json` | Explicit build (`npm run build`), start (`npm start`), and health check (`/api/health`). | Removes guesswork from how Railway builds and runs the service. |

These changes are safe for the existing pilot: nothing about the diagnostic,
practice, or dashboard logic was touched.

---

## Step 1 — Railway service variables

In your Railway project → the service → **Variables**, set:

**Required**

```
NODE_ENV=production
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<any long random string>
JWT_EXPIRE=7d
```

**Turn on the full ecosystem for partners** (without these, the Tutor and
Teacher dashboards show in the menu but return "not available" when clicked):

```
FEAT_PARENT=1
FEAT_TUTOR=1
FEAT_TEACHER=1
FEAT_WORKSHEETS=1
```

**Optional — show the internal analytics page to partners**

```
VITE_ENABLE_ADMIN=true
```

**Optional — only if you demo the AI worksheet/photo-marking feature**

```
OPENAI_API_KEY=<key>      # or ANTHROPIC_API_KEY=<key>
```

You do **not** need `CORS_ORIGIN` anymore, because the app and API share one
origin. (Leaving it set does no harm.)

> Railway exposes these variables to the build step, so `VITE_ENABLE_ADMIN`
> is baked into the app at build time. If you change it, redeploy.

---

## Step 2 — Point Railway at a cloud database (MongoDB Atlas)

The deployed app needs a cloud database. Your pilot accounts were seeded into a
database on your Mac, which Railway can't reach.

1. Create a free MongoDB Atlas cluster (atlas.mongodb.com).
2. Add a database user, and under Network Access allow Railway (use
   `0.0.0.0/0` temporarily if unsure).
3. Copy the connection string into the Railway `MONGODB_URI` variable above.

---

## Step 3 — Create the demo accounts in the cloud database

Run these **once**, with `MONGODB_URI` pointed at your Atlas database. Easiest
path is Railway's "Run a command" / shell on the service (or run locally on your
Mac with `MONGODB_URI` temporarily set to the Atlas string):

```bash
npm run seed:foundation
npm run seed:domains
npm run seed:fractions-alpha-pack
npm run seed:pilot-students
```

This creates the demo logins (all password: `Passw0rd!`):

| Role | Email |
|---|---|
| Student | `pilot.student1@tianos.test` … `pilot.student5@tianos.test` |
| Parent | `pilot.parent@tianos.test` |
| Tutor | `pilot.tutor@tianos.test` |
| Teacher | `pilot.teacher@tianos.test` |

(Optional richer parent view for filming: `npm run seed:demo` →
`demo.parent@tianos.test` / `Passw0rd!`.)

---

## Step 4 — Deploy and verify

After Railway redeploys, check in this order:

1. `https://<your-app>.up.railway.app/api/health` → should return
   `{"status":"Backend is running", ...}`.
2. `https://<your-app>.up.railway.app/` → should load the **app login screen**
   (not JSON, not an error).
3. Log in as `pilot.student1@tianos.test` / `Passw0rd!` → student dashboard
   loads.
4. Log in as `pilot.tutor@tianos.test` and `pilot.teacher@tianos.test` → those
   dashboards load (confirms the `FEAT_*` flags are working).

If `/api/health` works but `/` shows an error, the frontend build didn't run —
check the Railway build logs for `vite` and confirm the build command is
`npm run build`.

---

## Suggested demo flow (for distribution / channel partners)

Channel partners care about the breadth of the ecosystem and what they could
resell or white-label. Show the multi-role story, not just the student app:

1. **Student — the hook (5 min).** Log in as a student. Run a Fractions
   diagnostic, answer a few questions (include a deliberate mistake), and show
   the working-evidence capture and confidence buttons. Land on the progress
   page showing the F001–F026 skill map.
2. **The intelligence (3 min).** Open the Mistakes page → show how a wrong
   answer becomes a specific misconception, a Recovery Pack, and a recheck.
   This is the differentiator: "we don't just say the student is weak — we say
   *why*, and we prove it was fixed."
3. **Parent view (2 min).** Log in as the parent → plain-language explanation of
   the child's weak areas and recommended actions. This is the retention /
   word-of-mouth surface.
4. **Tutor / Teacher view (3 min).** Log in as tutor and teacher → assigned
   students, intervention visibility, class-level QA. This is the B2B2C surface
   a tuition centre or school partner would operate.
5. **Analytics (2 min, optional).** If `VITE_ENABLE_ADMIN=true`, open
   `/admin/pilot-analytics` → engagement, questions answered, most-missed
   skills. Shows partners the data they'd get.

Talking points for this audience: white-label / co-brand potential, the
multi-role workspace model (school vs. private-tutoring data separation is built
in), and the misconception-level diagnostic depth as the moat.

---

## Known limitations to mention honestly

- Content depth today is **Fractions (P1–P6 fraction skills F001–F026)**; the
  P1 number/measurement/geometry map is specified but not yet built.
- Free-tier Railway can sleep between requests — open the app a minute before
  the demo so the first load isn't slow.
- Tablet/stylus comfort for the working-evidence canvas should be checked on the
  actual demo device beforehand.

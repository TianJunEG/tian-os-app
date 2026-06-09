# Pilot Deploy Checklist — 5-Student MathPath Fractions

**Scope:** MathPath Fractions Intervention Pilot (F001–F026)
**Students:** 5 pilot students (P4, distinct learning profiles)
**Roles:** 1 parent, 1 tutor, 1 teacher + "Pilot Fractions P4" class
**Created:** 2026-06-10

---

## 1. Seed Data (run against staging/production DB)

Run in order. Each script is idempotent.

```bash
# 1a. Foundation: users, workspaces, math subject/topic/skill map
npm run seed:foundation

# 1b. MathPath questions (F001-F026 fractions content)
npm run seed:questions

# 1c. Fluency drill content
npm run seed:fluency

# 1d. (Optional) Fractions alpha content pack — bulk question generation
npm run seed:fractions-alpha-pack

# 1e. Pilot accounts: 5 students + parent + tutor + teacher + class
npm run seed:pilot-students
```

### Verify seed

After seeding, confirm all 8 pilot accounts can log in:

```bash
npm run qa:pilot:preflight
```

Expected: all `seed-accounts` checks PASS.

---

## 2. Railway Environment Variables

Set these as **service variables** in Railway (not in `.env` — `.env` is local dev only).

### Required

| Variable | Value | Purpose |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` | Production Atlas connection string |
| `JWT_SECRET` | *generate a real 64-char random secret* | Auth token signing. **DO NOT use the placeholder from .env** |
| `NODE_ENV` | `production` | Enables production mode |
| `PORT` | `5001` (or Railway default) | Server port |

### Feature Flags (pilot scope)

| Variable | Value | Purpose |
|---|---|---|
| `FEAT_PARENT` | `1` | Enables parent dashboard + `/api/family` routes |
| `FEAT_TEACHER` | `1` | Enables teacher dashboard + `/api/teacher` routes |
| `FEAT_TUTOR` | `1` | Enables tutor dashboard + `/api/tutor` routes |

### Optional (decide before launch)

| Variable | Value | Purpose |
|---|---|---|
| `FEAT_WORKSHEETS` | `1` | Enables worksheet generation (requires AI API keys) |
| `VITE_ENABLE_FLUENCY_PILOT` | `true` | Shows Fluency Practice tile on student dashboard |

### Must NOT be set

| Variable | Notes |
|---|---|
| `FEAT_LIFELAB` | LifeLab is not in pilot scope |
| `FEAT_SCIENCE` | Science module is not in pilot scope |
| `FEAT_SPELLING` | Spelling module is not in pilot scope |
| `FEAT_MECHANISMS` | Mechanisms module is not in pilot scope |

### AI API Keys (only if worksheets are in scope)

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Real Anthropic API key |
| `OPENAI_API_KEY` | Real OpenAI API key |
| `WORKSHEET_AI_PROVIDER` | `openai` or `anthropic` |
| `WORKSHEET_PRIMARY_MODEL` | e.g. `gpt-4o` or `claude-haiku-4-5` |

---

## 3. Frontend Build Variables

These are baked into the frontend at build time. Set in Railway **build** environment or in `frontend/.env.production`.

`frontend/.env.production` already contains:
```
VITE_API_URL=/api
VITE_ENABLE_ADMIN=true
```

If fluency is in scope, add to Railway build env:
```
VITE_ENABLE_FLUENCY_PILOT=true
```

---

## 4. Deploy

```bash
# Push to main — Railway auto-deploys
git push origin main
```

Railway uses:
- **Build:** `npm run build` (installs deps + builds frontend)
- **Start:** `node server.js` (serves API + static frontend)
- **Healthcheck:** `GET /api/health`

---

## 5. Post-Deploy Verification

### 5a. Healthcheck

```
curl https://<railway-domain>/api/health
```

Expected: `200 OK`

### 5b. Preflight smoke test

Run against the deployed URL:

```bash
QA_BASE=https://<railway-domain>/api npm run qa:pilot:preflight
```

### 5c. Manual smoke test (all 5 students)

| Step | Action | Expected |
|---|---|---|
| 1 | Login as `pilot.student1@tianos.test` | Dashboard loads, MathPath tile visible |
| 2 | Click MathPath | MathPath home loads (brand-new student = diagnostic CTA) |
| 3 | Login as `pilot.student2@tianos.test` | Dashboard loads, weak fractions evidence visible |
| 4 | Login as `pilot.student3@tianos.test` | Dashboard loads, strong fractions mastery shown |
| 5 | Login as `pilot.student4@tianos.test` | Dashboard loads, careless pattern in mistakes |
| 6 | Login as `pilot.student5@tianos.test` | Dashboard loads, slow-but-correct pattern visible |
| 7 | Login as `pilot.parent@tianos.test` | Parent home → 5 children listed |
| 8 | Click a child → Progress tab | Mastery data shown (or empty for student 1) |
| 9 | Login as `pilot.teacher@tianos.test` | Teacher home → "Pilot Fractions P4" class |
| 10 | Click class → Students tab | All 5 students listed |
| 11 | Click class → MathPath tab | Class mastery overview loads |
| 12 | Login as `pilot.tutor@tianos.test` | Tutor home → assigned students visible |

### 5d. Verify hidden modules

| Check | Expected |
|---|---|
| Student dashboard: no LifeLab tile | LifeLab flag is off |
| Student dashboard: no Science tile | Science flag is off |
| Student dashboard: no Spelling tile | Spelling flag is off |
| Teacher ClassNav: no LifeLab tab | Feature-flag guarded |
| Parent ChildNav: no LifeLab tab | Feature-flag guarded |
| Parent ChildNav: no Science tab | Feature-flag guarded |

---

## 6. Pilot Account Credentials

**Password for ALL pilot accounts:** `Passw0rd!`

| Role | Email |
|---|---|
| Student 1 (brand new) | `pilot.student1@tianos.test` |
| Student 2 (weak fractions) | `pilot.student2@tianos.test` |
| Student 3 (strong fractions) | `pilot.student3@tianos.test` |
| Student 4 (careless fast) | `pilot.student4@tianos.test` |
| Student 5 (slow low confidence) | `pilot.student5@tianos.test` |
| Parent | `pilot.parent@tianos.test` |
| Tutor | `pilot.tutor@tianos.test` |
| Teacher | `pilot.teacher@tianos.test` |

---

## 7. Rollback

A git tag `pilot-5-students-start` marks the pre-pilot codebase state.

```bash
# If needed, revert to pre-pilot state
git checkout pilot-5-students-start
```

---

## 8. Known Limitations (Pilot Scope)

| Limitation | Impact |
|---|---|
| No email delivery | Password resets don't work. Distribute passwords manually. |
| No media upload | LifeLab evidence upload is placeholder (not in pilot scope). |
| No notifications | No push/email when teacher assigns or gives feedback. |
| Fractions only | MathPath covers F001–F026 only. Not full P1–P6 math. |
| No worksheet AI without API keys | Worksheet generation requires Anthropic or OpenAI keys. |
| Fluency off by default on frontend | Must set `VITE_ENABLE_FLUENCY_PILOT=true` to show tile. |

---

## 9. Monitoring During Pilot

| Tool | Command |
|---|---|
| Pilot analytics dashboard | Login as admin → `/admin/pilot-analytics` |
| Railway logs | Railway dashboard → service → logs |
| QA re-check | `QA_BASE=https://<domain>/api npm run qa:pilot:preflight` |
| Bug logging template | `docs/mathpath/pilot/templates/pilot_bug_log_template.csv` |
| Weekly tracker template | `docs/mathpath/pilot/templates/pilot_weekly_tracker_template.csv` |
| Feedback rollup template | `docs/mathpath/pilot/templates/pilot_feedback_rollup_template.csv` |

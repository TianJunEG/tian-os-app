# Tian OS — 5-Student MathPath Pilot Runbook Lockfile

**Locked at:** 2026-06-05  
**Branch:** `main`  
**Commit:** `1ae527e4f024fbc511727601043e64b529c6050f`  
**Scope:** Fractions domain only, 5-student supervised pilot, no major feature work during active pilot.

This document is the final locked runbook for pilot execution and verification.  
Only the checks below are in scope for pilot readiness.

## 1) Environment Baseline (must be true before pilot sessions)

1. Node + npm available in environment.
2. MongoDB accessible.
3. Backend reachable and stable.
4. Frontend reachable and using the pilot user interface.
5. Seed data available for Fractions domain:
   - Foundation + domains
   - Fractions Alpha pack
   - Pilot accounts (`pilot.student1..5`)

Suggested base URLs:

- `QA_BASE` (backend API): `http://127.0.0.1:5001/api`
- `PLAYWRIGHT_BASE_URL` (frontend): `http://127.0.0.1:3000`
- `PLAYWRIGHT_API_BASE_URL`: same as `QA_BASE`

## 2) Lockfile seed/run sequence

Use this exact sequence in this order.

### Step A — Seed / reset data

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match \
MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/tutor-match \
AUTO_SEED_PILOT_ACCOUNTS=1 \
npm run seed:fractions-alpha-pack
```

### Step B — Start services

Start backend on dedicated terminal:

```bash
QA_DISABLE_RATE_LIMIT=1 \
MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match \
MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/tutor-match \
PORT=5001 \
npm start
```

Start frontend:

```bash
VITE_API_URL=http://127.0.0.1:5001/api \
npm --prefix frontend run dev -- --host 127.0.0.1 --port 3000
```

### Step C — Full pilot verification gate

```bash
QA_DISABLE_RATE_LIMIT=1 \
AUTO_SEED_PILOT_ACCOUNTS=1 \
QA_BASE=http://127.0.0.1:5001/api \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 \
PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:5001/api \
npm run qa:pilot
```

## 3) Expected results (lock criteria)

The lock state is only valid when all of the following pass:

1. Pilot preflight passes account seeding + backend/API reachability.
2. Backend-safe checks pass for student/tutor/parent/teacher contract.
3. Diagnostic gate passes (10-question expected behavior where configured).
4. Practice flow passes with persistent answers.
5. Working submission/working-not-needed paths behave.
6. Mistake capture and review screens show persisted data.
7. Route guards for disabled/unavailable pilot-facing routes behave safely.
8. Frontend build passes.

## 4) Locked command map

### Pilot validation scripts

- `npm run qa:pilot:preflight`
- `npm run qa:pilot:backend`
- `npm run qa:pilot:frontend`
- `npm run qa:pilot`

### Supportive checks

- `npm test -- routes/diagnostics.test.js utils/diagnosticRuntime.test.js utils/practicePersistence.test.js utils/mistakesRoute.test.js`
- `npm --prefix frontend run test -- src/pages/student/StudentDashboard.test.jsx src/pages/student/SkillGraph.test.jsx src/pages/student/mathpath/MistakesHome.test.jsx src/pages/student/mathpath/MistakeReview.test.jsx src/pages/student/mathpath/PracticeSession.test.jsx src/pages/student/mathpath/PracticeSession.telemetry.test.jsx`
- `npm --prefix frontend run build`

## 5) Locked outputs and artifacts

Write one immutable run artifact per pilot gate invocation:

- `docs/mathpath/pilot/logs/pilot-qa-gate-<timestamp>.md`
- `docs/mathpath/pilot/logs/pilot-foundation-<timestamp>.md` (preflight output if created)
- `frontend/playwright-report-pilot/` (for UI assertion evidence)
- `frontend/test-results/` (trace/video on failures)

## 6) Account matrix (pilot-only)

Pilot students:

- `pilot.student1@tianos.test`
- `pilot.student2@tianos.test`
- `pilot.student3@tianos.test`
- `pilot.student4@tianos.test`
- `pilot.student5@tianos.test`

Password (seed default): `Passw0rd!`

Adult test users:

- `pilot.parent@tianos.test`
- `pilot.tutor@tianos.test`
- `pilot.teacher@tianos.test`

## 7) Known blockers before successful launch (this runbook block)

If a block appears, **pause and resolve before students begin**:

- Backend unavailable or wrong `QA_BASE` (route checks will pass/fail incorrectly).
- Playwright environment failures unrelated to assertions (sandbox browser launch, system permissions).
- Demo/staging services not pointed to pilot DB (`MONGODB_URI` mismatch).
- Route mismatch between backend and frontend API base URLs.

## 8) Lockfile acceptance criteria

- Pilot launch is approved only when this lockfile checks are green and reproducible.
- Any post-lock code changes in core pilot paths require a new lockfile refresh and new `npm run qa:pilot` proof.


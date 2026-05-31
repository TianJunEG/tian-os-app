# MathPath Pilot QA Gate

This document defines the standard automated pilot-readiness QA gate for Tian OS MathPath (Fractions).

## Single Pilot QA Bundle

Primary command (repo root):

- `npm run qa:pilot`

This runs one consolidated pilot gate and writes a timestamped PASS/FAIL report.

## Commands

From repo root:

- `npm run qa:pilot:preflight`
- `npm run qa:pilot:backend`
- `npm run qa:pilot:frontend`
- `npm run qa:pilot` (full gate + consolidated report)

## What `qa:pilot` checks (Fractions MVP 5-student pilot path)

The gate reports PASS/FAIL for these areas:

1. Student login
2. Diagnostic start
3. Diagnostic answer/submit
4. Placement result
5. Continue Learning recommendation
6. Practice session
7. Timed answer capture
8. Result screen
9. Mistake capture
10. Parent dashboard reflects result
11. Tutor dashboard reflects result
12. Teacher dashboard reflects result
13. Working upload route availability
14. Assessment route availability
15. TestSpecificationPage route availability

The full gate writes a timestamped report to:

- `docs/mathpath/pilot/logs/pilot-qa-gate-<timestamp>.md`

## Prerequisites

1. Backend is running (default API base: `http://127.0.0.1:5001/api`)
2. Frontend is running (default web base: `http://127.0.0.1:3000`)
3. Playwright browsers installed:
   - `cd frontend && npx playwright install`
4. Demo seed data exists

## Seed / Reset Commands

Run from repo root:

```bash
npm run seed:foundation
npm run seed:domains
npm run seed:fractions-alpha-pack
npm run seed:test-accounts
```

If `seed:test-accounts` is not available in your branch, run:

```bash
node scripts/seedTestAccounts.js
```

## Environment Variables (optional overrides)

- `QA_BASE` (default `http://127.0.0.1:5001/api`)
- `PLAYWRIGHT_BASE_URL` (default `http://127.0.0.1:3000`)
- `PLAYWRIGHT_API_BASE_URL` (default `http://127.0.0.1:5001/api`)

## Expected Output

- Non-zero exit code if any area fails.
- Console summary with pass/fail counts.
- Detailed failure tails in the generated markdown report.
- Playwright artifacts for UI failures in:
  - `frontend/playwright-report-pilot`
  - `frontend/test-results/*` (trace/video/screenshot on failure)

## Troubleshooting

1. **Login timeouts / auth failures**
   - Ensure backend is reachable at `QA_BASE`.
   - Re-run `npm run seed:foundation`.

2. **CORS failures**
   - Verify `CORS_ORIGIN` includes frontend origin (`http://127.0.0.1:3000`).

3. **Route not found in UI tests**
   - Confirm frontend is running latest local branch.
   - Open route manually and verify path in `frontend/src/App.jsx`.

4. **No questions available**
   - Re-run `npm run seed:fractions-alpha-pack`.

5. **Dashboard contract failures**
   - Re-run `node scripts/qa-mathpath-dashboard-contract.js`.
   - Inspect latest `docs/mathpath/pilot/logs/dashboard-contract-*.md`.

6. **TestSpecificationPage route fails**
   - Confirm these routes are present in `frontend/src/App.jsx`:
     - `/parent/children/:studentId/mathpath/test-spec`
     - `/tutor/students/:id/mathpath/test-spec`
     - `/teacher/classes/:id/mathpath/test-spec`

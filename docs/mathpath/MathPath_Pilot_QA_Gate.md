# MathPath Pilot QA Gate

This document defines the standard automated pilot-readiness QA gate for Tian OS MathPath (Fractions).

## Commands

From repo root:

- `npm run qa:pilot:preflight`
- `npm run qa:pilot:backend`
- `npm run qa:pilot:frontend`
- `npm run qa:pilot` (full gate + consolidated report)

## What `qa:pilot` checks

The gate reports PASS/FAIL for these areas:

1. Environment preflight (API reachability, frontend API config, CORS, Mongo config)
2. Seeded account smoke (`demo.student`, `demo.parent`, `demo.tutor`, `demo.teacher`)
3. Fractions Diagnostic UI flow
4. Placement persistence + reuse
5. Fractions Practice UI flow
6. Working Upload UI flow
7. Assessment UI flow
8. Question Review screen
9. Cross-dashboard consistency contract
10. Tutor/Teacher route guard coverage

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


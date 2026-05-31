# MathPath Fractions Final Pilot Closure Checklist v1.0

Purpose: strict final gate for Fractions MVP before real-student pilot.

## How to run

From repo root:

```bash
npm run qa:fractions:closure
```

The command writes a timestamped report to:

`docs/mathpath/pilot/logs/fractions-final-closure-<timestamp>.md`

## Pass/Fail gates (in order)

1. Fractions depth regression tests
2. Fractions coverage report regeneration
3. Seeded DB coverage proof (alpha pack seed)
4. Pilot API preflight (backend/CORS/seed accounts)

## Decision rules

- **NO-GO**: any critical gate fails.
- **CONDITIONAL GO**: all critical gates pass but non-critical evidence is incomplete.

## Current critical blockers to clear for GO

1. MongoDB connectivity for seeded coverage proof.
2. Backend API reachability for pilot preflight.
3. Seed-account login verification via running backend.


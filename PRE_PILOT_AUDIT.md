# Tian OS Pre-Pilot Audit

Date: 2026-06-04

## Verdict

**CONDITIONAL GO for the 5-student internal Fractions pilot.**

All student-critical pilot blockers found during this audit were fixed or verified as runtime configuration requirements. The pilot can start if the backend is run against the seeded Mongo database with the pilot feature flags enabled for adult dashboards.

Required runtime flags for the pilot environment:

```bash
FEAT_PARENT=1
FEAT_TUTOR=1
FEAT_TEACHER=1
MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match
MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/tutor-match
```

The local frontend `.env` still points to `http://localhost:5001/api`. For the smoke run below, the clean backend was run on `5010`; pilot runtime must use the matching API URL.

## Pilot Blockers Fixed

| Area | Finding | Fix | Status |
|---|---|---|---|
| Pilot accounts | Existing pilot adult accounts could keep old hashed passwords, causing login failure after reseed. | `scripts/seedPilotStudents.js` now resets all pilot users to `Passw0rd!` during seed. | Fixed |
| Pilot student seed | `Student.profile.studentVisualMode` rejected empty string during pilot reseed. | `models/Student.js` default is now `upper_primary`; pilot seed explicitly sets `upper_primary`. | Fixed |
| Practice question count | F001 practice returned 1 item instead of 5 because `selectSimilarQuestions` deduped by stem only. Visual fraction questions share the same prompt but differ by diagram/answer. | `utils/worksheetGen.js` now dedupes by stem + answer + visual + figure URL. Regression test added. | Fixed |
| Tutor dashboard smoke | `/api/tutor/home` returns `not_available` without pilot feature flags. | Verified as feature-gate configuration, not route breakage. With `FEAT_TUTOR=1`, tutor home and students load. | Runtime requirement |

## Area Audit

### 1. Student Home

Status: **Pass via build/tests and API smoke.**

- Upper-primary visual mode is available and pilot students are seeded with `upper_primary`.
- XP/streak/profile summary route loads for all five pilot students.
- No API-level blocker found for student profile, mastery summary, progress graph, or mistakes route.

Manual visual QA still recommended on the actual pilot browser URL for 360px and 390px widths.

### 2. MathPath / Fractions

Status: **Pass.**

- Final closure report: `CONDITIONAL GO`, 4/4 gates passed.
- Coverage report shows `Pilot readiness score: 100/100`.
- F001-F026 seeded coverage proof passed in the closure script.
- Practice smoke now returns 5 F001 questions after selector fix.

### 3. Question Quality

Status: **Pass for pilot blockers.**

- `node scripts/auditFractionsQuestionQuality.js` checked 5280 generated items.
- Failures: 0.
- Warnings: 751 repeated generated item warnings.

Repeated generated item warnings are non-blocking for the 5-student pilot but should be improved before broader rollout.

### 4. Answer Input

Status: **Pass in targeted tests.**

- Fraction, mixed number, and answer renderer tests passed.
- Mixed-number state preservation is covered in `AnswerInputRenderer` tests.
- Fraction generator tests passed.

### 5. Working Evidence

Status: **Pass in targeted tests.**

- Full-screen working component tests passed.
- Drawing/save/delete and movable math-object support are covered by tests.
- Practice API accepts working-related attempt metadata.

Manual tablet/stylus QA is still recommended before using working evidence as an adult-review source.

### 6. Confidence

Status: **Pass via route inspection/tests.**

- Practice attempts store confidence/reflection fields.
- Telemetry records `confidence_selected` and answer metadata.
- Learning telemetry tests passed.

### 7. Mistake-to-Mastery

Status: **Pass for route availability.**

- `/api/mistakes` loaded for all five pilot students.
- Practice attempt submission path creates attempts and can record mistakes when incorrect.

Manual verification of the student-facing Mistake Review screen remains recommended.

### 8. Progress Page

Status: **Pass via API smoke.**

- `/api/mastery/graph?domain=fractions` returned 200 for all five pilot students.
- Fractions progress denominator issue was previously fixed; coverage and skill graph remain at 26 skills.

### 9. Parent Dashboard

Status: **Pass with pilot flags.**

- Parent login passed.
- `/api/family/children` returned 200.

### 10. Tutor Dashboard

Status: **Pass with pilot flags.**

- Tutor login passed.
- Tutor workspace context resolved.
- `/api/tutor/home` and `/api/tutor/students` returned 200 when `FEAT_TUTOR=1`.

Without `FEAT_TUTOR=1` or a higher `TIANOS_VERSION`, tutor APIs are intentionally gated and return `not_available`.

### 11. Mobile QA

Status: **Partial.**

- Frontend production build passed.
- Component tests passed for visual mode, answer input, and full-screen working.
- Full manual mobile browser pass was not completed in this terminal session.

Recommended before first live student: open Student Home, MathPath, Practice, Working Mode, Progress, Parent, and Tutor dashboards at 360px and 390px.

### 12. Telemetry

Status: **Pass in targeted tests and route inspection.**

Events verified in code paths:

- `session_started`
- `question_viewed`
- `question_answered`
- `question_skipped`
- `confidence_selected`
- `working_saved`
- `working_submitted`
- `working_not_needed_declared`
- `practice_completed`
- `diagnostic_completed`

`utils/learningTelemetryService.test.js` passed.

### 13. Empty/Error States

Status: **No blocking raw errors found in smoke.**

- Student profile, mastery, progress graph, mistakes, parent children, tutor home, tutor students, and teacher home returned structured responses.
- No raw JSON was exposed in API smoke.

### 14. Pilot Smoke Test

Status: **Pass.**

Seeded pilot accounts:

- `pilot.student1@tianos.test`
- `pilot.student2@tianos.test`
- `pilot.student3@tianos.test`
- `pilot.student4@tianos.test`
- `pilot.student5@tianos.test`
- `pilot.parent@tianos.test`
- `pilot.tutor@tianos.test`
- `pilot.teacher@tianos.test`

Password for all: `Passw0rd!`

API smoke results against clean backend on port 5010:

- All five students logged in.
- Student profile loaded for all five.
- Mastery summary loaded for all five.
- Progress graph loaded for all five.
- Diagnostic start loaded for all five.
- Practice start returned 5 items for all five.
- Practice attempt submission worked for all five.
- Mistakes route loaded for all five.
- Parent dashboard child snapshot loaded.
- Tutor dashboard home/students loaded with `FEAT_TUTOR=1`.
- Teacher home loaded with `FEAT_TEACHER=1`.

## Commands Run

```bash
npm test -- utils/mathpath.test.js utils/learningTelemetryService.test.js utils/fluencyEngine.test.js
```

Result: pass, 3 files, 20 tests.

```bash
npm --prefix frontend run test -- src/student/studentVisualMode.test.js src/pages/student/mathpath/components/AnswerInputRenderer.test.jsx src/components/learning/FullScreenWorkingMode.test.jsx src/mathpath/fractions/fractionQuestionGenerator.test.js src/mathpath/fractions/fractionFluencyRetentionEngine.test.js
```

Result: pass, 5 files, 51 tests.

```bash
node scripts/auditFractionsQuestionQuality.js
```

Result: 5280 items checked, 0 failures, 751 repeated-item warnings.

```bash
npm test -- utils/worksheetGen.test.js
```

Result: pass, 24 tests.

```bash
npm test -- utils/mathpath.test.js utils/learningTelemetryService.test.js utils/worksheetGen.test.js
```

Result: pass, 3 files, 41 tests.

```bash
npm --prefix frontend run test -- src/student/studentVisualMode.test.js src/pages/student/mathpath/components/AnswerInputRenderer.test.jsx src/components/learning/FullScreenWorkingMode.test.jsx src/mathpath/fractions/fractionQuestionGenerator.test.js
```

Result: pass, 4 files, 39 tests.

```bash
npm --prefix frontend run build
```

Result: pass.

```bash
env QA_BASE=http://127.0.0.1:5010/api PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/tutor-match node scripts/qa-pilot-preflight.js
```

Result: pass, 16/16.

```bash
env QA_BASE=http://127.0.0.1:5010/api PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/tutor-match node scripts/fractions-final-pilot-closure.js
```

Result: `CONDITIONAL GO`, 4/4 gates passed.

Latest closure log:

`docs/mathpath/pilot/logs/fractions-final-closure-2026-06-04T06-12-38-999Z.md`

## Files Changed In This Audit

- `models/Student.js`
- `scripts/seedPilotStudents.js`
- `utils/worksheetGen.js`
- `utils/worksheetGen.test.js`
- `PRE_PILOT_AUDIT.md`

Note: `utils/worksheetGen.js` and `utils/worksheetGen.test.js` already contained older unrelated dirty changes. The pilot-blocking change in this audit is the same-stem visual question dedupe fix and its regression test.

## Non-Blocking Issues

1. Full manual mobile browser QA was not completed here. Run it on the actual pilot deployment URL.
2. Fraction question quality audit still reports repeated generated item warnings, but no broken generated items.
3. Closure decision remains `CONDITIONAL GO`, not unconditional, because the pilot depends on seeded DB/runtime flags.
4. Tutor and teacher dashboards require feature flags in the pilot backend.
5. The worktree contains many older unrelated dirty files and generated/report artifacts. Commit only the scoped pilot fixes after review.

## Final Go/No-Go

**Conditional GO.**

The five-student Fractions pilot can begin after confirming the deployed backend uses:

- the seeded `tutor-match` database,
- correct frontend `VITE_API_URL`,
- `FEAT_PARENT=1`,
- `FEAT_TUTOR=1`,
- `FEAT_TEACHER=1`.


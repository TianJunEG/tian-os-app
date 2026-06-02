# Tian OS MathPath Fractions Pilot Readiness Report

Date: 2026-06-02  
Scope: 5-student supervised Fractions pilot  
Mode: Stabilise only, no new learning modules

## Ready

### Pilot Accounts

All pilot accounts were seeded in local MongoDB with deterministic credentials.

Password for all accounts: `Passw0rd!`

| Role | Email | Profile |
|---|---|---|
| Student | `pilot.student1@tianos.test` | Brand-new P4 student, no seeded MathPath history |
| Student | `pilot.student2@tianos.test` | Weak early fractions with open remediation evidence |
| Student | `pilot.student3@tianos.test` | Strong early fractions with secure mastery records |
| Student | `pilot.student4@tianos.test` | Fast, overconfident, careless-error profile |
| Student | `pilot.student5@tianos.test` | Slow, low-confidence, correct-but-effortful profile |
| Parent | `pilot.parent@tianos.test` | Linked to all five pilot students |
| Tutor | `pilot.tutor@tianos.test` | Linked to all five pilot students |
| Teacher | `pilot.teacher@tianos.test` | Owns `Pilot Fractions P4` class with all five students |

### Journey Smoke

The critical student routes were verified on local backend `5002` and frontend `3000` using `pilot.student1@tianos.test`.

| Check | Result | Notes |
|---|---|---|
| Login/API preflight | Ready | Backend reachable, CORS allowed, demo and pilot logins returned `200` |
| Diagnostic entry | Ready | Browser smoke reached diagnostic/check-in surface |
| Practice entry | Ready after fix | Browser smoke reached timed question surface |
| Working upload route | Ready | Browser smoke confirmed route renders for student |
| Full-screen working mode | Ready | Component tests cover drawing, reset, save, and worksheet layout |
| Mistake-to-Mastery diagnostic intake | Ready | Existing route writes incorrect and skipped diagnostic responses to `Mistake` |
| Diagnostic explainability engine | Ready | Focused tests pass |
| Mistake-to-Mastery engine | Ready | Focused tests pass |

## Needs Fix Before Pilot

None remaining from this pass.

One blocker was found and fixed:

| Blocker | Fix |
|---|---|
| `Continue Learning` could pass a Mongo ObjectId such as `6a1bd1c86353c0d4ff197f31` into Fractions practice, causing `Invalid skillId` instead of a question surface. | `MathPathHome` and `PracticeSession` now accept only framework skill IDs like `F001` for Fractions practice fallbacks, with `F001` as a safe default. |

## Can Defer

| Item | Reason |
|---|---|
| Full end-to-end completion of an entire diagnostic with five live students | Route and API smoke is ready; live pilot can capture this under observation. |
| Parent/tutor/teacher deep dashboard UX validation | Links and seeded visibility exist; this pass did not manually inspect every adult dashboard screen. |
| Cross-device manual stylus QA on physical tablets | Full-screen working mode is covered by component tests; final comfort check should happen on the actual pilot tablets. |
| Long-run content analytics over multiple sessions | Needs real pilot usage data. |

## Verification Run

Commands run:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/tutor-match npm run seed:pilot-students
node --input-type=module -e "import './models/Student.js'; import './scripts/seedPilotStudents.js'; console.log('pilot readiness imports ok')"
npm test -- utils/fractionSkillResolver.test.js utils/diagnosticReplayPolicy.test.js utils/workingCodeService.test.js
npm --prefix frontend run test -- src/components/learning/FullScreenWorkingMode.test.jsx src/components/learning/WorkingCanvas.test.jsx src/mathpath/fractions/fractionDiagnosticExplainabilityEngine.test.js src/mathpath/fractions/fractionMistakeToMasteryEngine.test.js
QA_BASE=http://127.0.0.1:5002/api PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/tutor-match node scripts/qa-pilot-preflight.js
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:5002/api VITE_API_URL=http://127.0.0.1:5002/api PILOT_STUDENT_EMAIL=pilot.student1@tianos.test PILOT_STUDENT_PASSWORD=Passw0rd! npm --prefix frontend run test:pilot-gate -- tests/e2e/pilot-gate.diagnostic-placement.spec.js tests/e2e/pilot-gate.practice.spec.js tests/e2e/pilot-gate.working-upload.spec.js
npm --prefix frontend run build
```

Results:

| Suite | Result |
|---|---|
| Backend focused tests | 3 files passed, 12 tests passed |
| Frontend focused tests | 4 files passed, 22 tests passed |
| Pilot preflight | 16 checks passed, 0 failed |
| Pilot browser smoke | 3 passed |
| Frontend production build | Passed |

## Recommendation

Fractions is ready for a supervised 5-student pilot after pulling this commit and reseeding pilot accounts in the pilot environment.

Before the first live student session, do one manual device rehearsal on the exact tablet/browser combination that students will use: login, start Fractions, open practice, open full-screen working, draw, reset, save, and submit one answer.

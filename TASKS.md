# Tian OS Pilot Task Queue

Scope: 5-student supervised MathPath Fractions pilot (F001–F026). Keep the active
F001–F026 architecture in place. Do NOT build Paper Review, Learning Intelligence,
WordPath, new curriculum, new question banks, or micro-skill migration before the pilot.

Claude works through this list top to bottom. Mark an item `[x]` only when it is done
**and** verified (relevant tests/build pass). Keep going until every box is checked.

## How to run
- Continuous: `./run-claude-continuous.sh`  (auto-resumes after each stop / quota reset)
- One pass:   `claude -p "Work through TASKS.md until everything is checked and tests pass"`

## Rules for Claude
- Do tasks in order unless a dependency forces otherwise.
- After each task, run its "Verify" command(s) before checking it off.
- If blocked, add a `> BLOCKED: <reason>` note under the item and move on.
- Only patch critical/high pilot blockers. Do not add new modules or expand curriculum scope.
- Never delete tasks — only check them off.

---

## 0. Stabilise work already in progress
There are uncommitted changes in WorkingEvidenceDecision, mistakes pages, PracticeSession,
SubmissionReviewModal, QuestionReviewCards, and routes/mistakes.js.

- [ ] Review the current uncommitted diff (`git status --short`, `git diff`), confirm each change
      is intentional and pilot-scoped, and either finish or revert anything half-done.
      Verify: `npm test` and `npm --prefix frontend run build` both green.

## 1. P0 — Student identity correctness (no demo-student fallback)
Source: docs/mathpath/PILOT_FIX_PLAN.md §1.
- [ ] Remove `demo-student` / fake local-state fallbacks from student flows so real student id is
      always used: MathPathHome.jsx, PracticeSession.jsx, FractionsStoryModeSession.jsx,
      FractionsLearningPathPage.jsx, working/WorkingUploadReviewScreen.jsx,
      assessment/AssessmentIntroScreen.jsx, StudentDashboard.jsx, utils/studentContext.js.
      Verify: unit tests asserting no demo fallback; text scan finds no `demo-student` in student paths;
      `npm --prefix frontend run build`.

## 2. P0 — Diagnostic completes reliably end-to-end
Source: PILOT_FIX_PLAN §1 + DIAGNOSTIC_AUDIT.md (a 10-question diagnostic must not end after 1 answer).
- [ ] Confirm diagnostic start → hydrate questions → submit answers → persist results works, and the
      completion contract (target_reached / placement_confident / coverage_complete /
      question_generation_failed / in_progress) is enforced with min-question-count honored.
      Files: frontend diagnostic/*, routes/diagnostics.js, services/diagnostics/diagnosticRuntime.js,
      fractionDiagnosticEngine.js, fractionQuestionRepair.js.
      Verify: `node --test routes/diagnostics.test.js` (or `npm test`) + DiagnosticQuestionScreen tests.

## 3. P0 — Practice attempts persist (mastery / mistakes / telemetry)
Source: PILOT_FIX_PLAN §1.
- [ ] Ensure practice answer submission and completion persist attempts and update mastery, mistakes,
      and telemetry for BOTH local-generated and API sessions (paths must not diverge).
      Files: PracticeSession.jsx, fractionPracticeFlow.js, routes/practice.js, routes/mastery.js,
      models/PracticeAttempt.js, models/mathpath/MathPathAttempt.js, learningTelemetryService.js.
      Verify: backend practice-completion test + frontend answer-validation test; `npm test`.

## 4. P0 — Working Evidence decision enforced without blocking mental work
Source: PILOT_FIX_PLAN §1.
- [ ] Require answer + confidence + (working submitted OR "I did not need working") before submit,
      across mouse/touch/full-screen, without losing saved strokes/math objects on save/reopen.
      Files: WorkingEvidenceDecision, WorkingCanvas, FullScreenWorkingMode, WorkingPreviewCard,
      PracticeSession.jsx, DiagnosticQuestionScreen.jsx, routes/mathpathWorking.js.
      Verify: frontend tests for disabled-submit-until-decision and full-screen save/reopen; `npm test`.

## 5. P0 — Mistakes created and reviewable after wrong answers
Source: PILOT_FIX_PLAN §1.
- [ ] Confirm wrong answers create mistakes that appear in MistakesHome and open in MistakeReview with
      linked working. Files: routes/mistakes.js, models/Mistake.js, PracticeSession.jsx,
      MistakesHome.jsx, MistakeReview.jsx, MistakeDetail.jsx, fractionMistakeToMasteryEngine.js,
      workingLinkageService.js.
      Verify: backend mistakes route tests + frontend Mistakes* tests; `npm test`.

## 6. P0 — Progress & dashboard reflect real state, not stale local state
Source: PILOT_FIX_PLAN §1 + §2 (client mathPathDomainProgressState can drift).
- [ ] Make dashboard/progress read backend mastery as source of truth (fractions progress uses full
      F001–F026 domain, no undefined/blank metrics, useful empty states). Refresh after completion
      must reflect new state. Files: StudentDashboard.jsx, Progress.jsx, MathPathHome.jsx,
      mathPathDomainProgressState.js, routes/mastery.js, routes/studentAnalytics.js.
      Verify: dashboard/progress frontend tests + mastery/analytics backend tests; `npm test`.

## 7. P0 — Gate broken/unstable routes & remove developer-facing copy
Source: PILOT_FIX_PLAN §1 + §4.
- [ ] Hide from student nav/CTAs: Paper Review/assessment upload, test-spec/blueprint, worksheet
      generator, WordPath, unsupported Story Mode domains, seeding controls. Replace any
      `Run npm run seed:*`, `No questions seeded yet`, `Not seeded yet`, coming-soon copy with
      student-friendly empty states. Files: App.jsx, navigationConfig.js, modules.js, featureFlags.js,
      featureGate.js, ScienceTopics.jsx, MathPathHome.jsx, FluencySkills.jsx, StoryModeDomainRoute.jsx.
      Verify: route-inventory test + visible-text scan for `Run npm`, `seeded`, `demo-student`,
      `mock`, `placeholder`; Playwright visible-routes nav smoke.

## 8. P1 — High-priority bug sweep
Source: PILOT_FIX_PLAN §2.
- [ ] Align diagnostic-session route tests to real route shape; verify working-upload cannot start
      without session context (student-friendly return, no orphan uploads); confirm Fluency stays
      student-friendly on empty inventory; add consistent error handling for 401/403/429/500 in the
      API service layer and key MathPath pages.
      Verify: `npm test` + `npm --prefix frontend run build`.

## 9. Audit follow-ups — working-evidence UI consolidation
Source: ANSWER_WORKING_UX_AUDIT.md "Follow-Up Recommended".
- [ ] Extract repeated `WorkingCanvas` + `WorkingEvidenceDecision` markup into a shared
      `WorkingEvidencePanel`; extract repeated working summary/status copy into a shared
      `WorkingSummary`; align Model Trainer drawing save state to the new panel API; add E2E coverage
      for assessment working submission with confidence + working evidence.
      Verify: `npm --prefix frontend test -- AnswerInputRenderer` + `npm --prefix frontend run build`.

## 10. FINAL — Full pilot preflight gate (must be green)
Source: PILOT_READINESS.md.
- [ ] Run the full preflight and confirm no blocking failures:
      ```bash
      npm test
      npm --prefix frontend run build
      node scripts/auditFractionsQuestionQuality.js --variants=12
      node scripts/updateFractionsCoverageReport.js
      QA_BASE=http://127.0.0.1:5002/api PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 node scripts/qa-pilot-preflight.js
      ```

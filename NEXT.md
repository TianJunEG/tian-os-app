# NEXT — Refocus on Pilot-Critical Work

**Stop expanding scope.** Recent commits added agency/Stripe-Connect billing, P1 numbers content,
and school claim codes. These are **non-goals** per `docs/mathpath/PILOT_FIX_PLAN.md` ("Explicit
Non-Goals" + §5 Postpone) until the F001–F026 Fractions loop is proven. Pause all of it.

**Do these, in order. Do not start new modules until all are checked.**

## 1. C1 — Quarantine the 14 incorrect fraction→skill mappings (TOP BLOCKER)
Why: they still generate live questions → live evidence shown to parents. Confirmed undone — there
are zero quarantine markers in source today.
- Source list: `docs/mathpath/FRACTIONS_QUESTION_SKILL_INTEGRITY_AUDIT.md` (14 incorrect, 21 questionable).
- Files: `frontend/src/mathpath/fractions/fractionQuestionFamilies.js`,
  `frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js`.
- Done when: quarantined families are excluded from generation AND flagged by
  `services/mathpath/fractionsRuntimeEvidenceIntegrityService.js`; regenerate any pilot
  worksheets/recovery packs sourced from flagged families.
- Verify: `npm test`.

## 2. Remaining P0 runtime blockers (PILOT_FIX_PLAN §1)
These decide whether 5 real students can complete the loop. Order:
- Remove `demo-student` / fake-state fallbacks from live student paths (`utils/studentContext.js`,
  `MathPathHome.jsx`, `PracticeSession.jsx`, `FractionsStoryModeSession.jsx`,
  `FractionsLearningPathPage.jsx`, `working/WorkingUploadReviewScreen.jsx`,
  `assessment/AssessmentIntroScreen.jsx`, `StudentDashboard.jsx`).
- Diagnostic completes reliably end-to-end (`routes/diagnostics.js`, `services/diagnostics/*`,
  diagnostic screens).
- Practice attempts persist for BOTH local and API sessions (`fractionPracticeFlow.js`,
  `routes/practice.js`, `routes/mastery.js`, `models/PracticeAttempt.js`).
- Verify each: relevant unit/backend test + `npm --prefix frontend run build`.

## 3. Evidence/access consistency (PILOT_FIX_PLAN §1b)
- Confirm `hasMasteryEvidence` (`fractionsRuntimeEvidenceIntegrityService.js`) requires a passing
  recheck/retention; set Fractions `requiresMisconceptionResolved: true`; stop auto-inferring
  `mastery_check` from attempt count (`masteryCriteriaEngine.js`).
- Enforce `StudentGuardian.accessLevel === 'view_only'` on guardian write routes.

## Guardrails (do not break)
- Never weaken `StudentGuardian` access; never remove evidence fields on
  `Mistake`/`PracticeAttempt`/working models; never expose raw F-codes/misconception IDs in
  student/parent UI; never claim "mastered"/"P1–P6 ready" beyond the gated correction flow.
- Keep school-admin / teacher-dashboard / notifications / entitlements feature-flag gated.
- Commit per task. Run tests/build before checking anything off. No Playwright artifacts in commits.

## Working agreement
- Treat `docs/mathpath/PILOT_FIX_PLAN.md` as source of truth; regenerate `TASKS.md` FROM it
  (include §1b) rather than overwriting these items.

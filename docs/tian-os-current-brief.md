# Tian OS — Current Working Brief

**Last updated:** 2026-06-09
**Maintainer:** Founder
**Scope of this brief:** Tian OS product + codebase only. No unrelated projects or personal memory.
**Repo:** `edu-os-app` (monorepo: Express/MongoDB backend + React/Vite frontend)

---

## 0. Source Note (read first)

This brief was built from the live repository and the existing master docs under
`docs/tian-os/` and `docs/tian-os-*.md`.

The three external docs referenced in the task request —
`Tian Jun Education Group.docx`, `Tian Jun Education Group - Updated Progress Brief.docx`,
and `Partnership_Pipelines_GTM_Expansion.docx` — **were not present in the workspace**
(`uploads/` was empty and a filesystem search found nothing matching). Their GTM/partnership
content is therefore **not** reflected here. To fold them in, drop them into the workspace and
re-run; only the "Recommended Next Sprint" and a future "GTM / Partnerships" section would change.

---

## 1. Current Understanding

**What Tian OS is.** An AI-native education operating system with a single shared student profile —
not a bundle of separate apps. The core promise: *identify what a child misunderstood, teach that
specific gap, verify improvement, and show trustworthy evidence to adults.*

**Current safe product scope (do not overclaim).** **MathPath — Fractions Intervention Pilot.**
Per `docs/tian-os/00_REPO_AUDIT.md` and `01_EXECUTIVE_OVERVIEW.md`, the only externally-safe claim
today is a small, controlled Fractions intervention pilot. Do **not** position as full P1–P6 Singapore
Math, school-ready, or validated mastery detection.

**Core learning loop (the product's spine):**

```
Diagnostic → Mistake Evidence → Recovery Pack → Teaching Flow → Recheck → Growth Report
```

Activity alone (clicking "reviewed", viewing a page, completing questions) must **never** count as
mastery. Evidence comes from correction, guided + independent practice, rechecks, and working
evidence over time.

**Module hierarchy (from `docs/tian-os-mvp-scope.md`, the scope source of truth):**

- **Primary (math core):** MathPath, Fluency Practice, Mistake-to-Mastery, Mastery Worksheet
  Generator, Skill Graph / Progress, Assignments.
- **Secondary (reinforcement, shown but not the core):** Spelling Practice (the *only* English
  surface), Science Adaptive Revision, LifeLab (applied Math + Science only).
- **Dashboards:** Student, Parent (live); Tutor (near-term, in flight); Teacher (future, in flight).

**Stack.** React 18 + Vite 4 + Tailwind + React Router 6, KaTeX, Stripe.js (frontend);
Express + Mongoose/MongoDB Atlas, Multer uploads (backend); Vitest + Playwright tests; Railway
(backend) + Vercel/Express-served frontend. JavaScript (no TypeScript). ~54 Mongoose models,
~60 route files, domain-organised `services/`.

---

## 2. Existing Features Found (built & maintained)

These are present in code and recently touched (dates = file mtimes), so treat as **live**.

**Working-evidence capture (the differentiator — actively maintained):**
- `WorkingCanvas.jsx` — draw working on a canvas (updated 2026-06-09).
- `FullScreenWorkingMode.jsx` — full-screen working with save/restore (updated 2026-06-09).
- `WorkingToolbar.jsx`, `drawingUtils.js`, `StrokeReplayPlayer.jsx` — drawing tools + stroke replay.
- `WorkingEvidenceDecision.jsx` — student declares working type (on-screen / on-paper / none).
- `QuestionAnnotationOverlay.jsx`, `WorkingAttachmentPreview.jsx`, `WorkingPreviewCard.jsx`.
- Upload flow: `pages/student/mathpath/working/` — `WorkingUploadScreen`, `WorkingUploadReviewScreen`,
  `WorkingUploadSuccessScreen` (route-level paper-upload handoff).
- Per `ANSWER_WORKING_UX_AUDIT.md`: practice, diagnostic, assessment, and similar-practice all share
  `WorkingCanvas` + `WorkingEvidenceDecision`; Model Trainer uses full-screen working.

**Paper / assessment upload + extraction (real, not stubbed):**
- `routes/assessmentUploads.js` — Multer upload (PDF/JPG/PNG/WebP, 12 MB), consent-gated.
- `services/mathpath/assessmentAnalysisService.js` — `extractAssessmentMetadataFromBuffer` does real
  PDF text extraction → blueprint extraction → diagram + question metadata. (Note: this is
  PDF-text/blueprint extraction, **not** handwriting OCR — see §4.)

**MathPath Fractions engine (the deepest, most complete area):**
- `services/mathpath/` — skill graph F001–F026, question generator/families, misconception registry +
  detection, mastery criteria, recheck recommendation, `fractionMistakeToMasteryEngine.js`,
  assessment readiness gate, diagnostic explainability.
- Frontend `mathpath/` mirrors: diagnostics, fluency, fractions practice/assessment,
  mistake-to-mastery, dashboard engines (student/parent/tutor/teacher/adult).

**Student-facing flows:** diagnostic screens, practice sessions, assessment review,
`MistakesHome` / `MistakeDetail` / `MistakeReview`, fractions story mode.

**Platform:** auth, parent–child via `StudentGuardian` (source of truth), billing/Stripe scaffolding,
partner organisations, telemetry events, seed + QA pilot-gate scripts.

---

## 3. Existing Files / Components (map: feature → code)

| Feature | Key files |
|---|---|
| Working canvas | `frontend/src/components/learning/WorkingCanvas.jsx` (+ `.test.jsx`) |
| Full-screen working | `frontend/src/components/learning/FullScreenWorkingMode.jsx` (+ `.test.jsx`) |
| Drawing tools / replay | `WorkingToolbar.jsx`, `drawingUtils.js`, `StrokeReplayPlayer.jsx`, `QuestionAnnotationOverlay.jsx` |
| Working evidence decision | `frontend/src/components/learning/WorkingEvidenceDecision.jsx` |
| Paper upload flow | `frontend/src/pages/student/mathpath/working/WorkingUpload*Screen.jsx` |
| Working analysis | `frontend/src/mathpath/working/workingAnalysisFramework.js` |
| Upload API + extraction | `routes/assessmentUploads.js`, `services/mathpath/assessmentAnalysisService.js` |
| Mistake-to-Mastery | `frontend/src/mathpath/fractions/fractionMistakeToMasteryEngine.js`; pages `MistakesHome/MistakeDetail/MistakeReview` |
| Fractions core | `services/mathpath/fractionSkillGraph.js`, `fractionQuestionGenerator.js`, `misconceptionDetectionService.js`, `masteryCriteriaEngine.js`, `recheckRecommendationService.js` |
| Diagnostics | `routes/diagnostics.js`, `frontend/src/pages/student/mathpath/diagnostic/` |
| Dashboards | `frontend/src/mathpath/dashboard/*DashboardEngine.js`; `pages/teacher/TeacherMathPathDashboardPage.jsx` |
| Auth / family / context | `routes/auth.js`, `routes/family.js`, `routes/context.js`, `models/StudentGuardian.js` |
| Master docs | `docs/tian-os/00–06`, `docs/tian-os-mvp-scope.md`, `docs/tian-os-master-product-spec.md` |

---

## 4. Incomplete or Missing Work (internal — not user-facing)

Mark these internally. **Do not surface any of these as finished features in the UI** until backed by
real data/flows.

**In-flight, uncommitted (present on `main` working tree, not yet committed):**
- **Tutor Dashboard** — `TUTOR_DASHBOARD_ARCHITECTURE.md`, `TUTOR_DASHBOARD_IMPL_PLAN_N1_A1.md`,
  modified `TeacherMathPathDashboardPage.jsx`. Near-term per scope; needs core mastery/mistake data
  real first.
- **Teacher Dashboard + tiers** — `docs/TEACHER_DASHBOARD_AND_TIERS_PLAN.md`. Scope marks Teacher as
  **future** — keep behind a flag, do not expose broadly.
- **Entitlements / billing tiers** — `services/billing/entitlements.js`, `middleware/entitlements.js`,
  `frontend/src/context/useEntitlements.js`. New, untested in prod paths.
- **School admin** — `routes/schoolAdmin.js`, `frontend/src/pages/admin/school/`,
  `models/ClassJoinCode.js`. Aligned to school rollout, which the audit says we are **not** ready for.
- **Notifications** — `routes/notifications.js` (+ test), `services/notifications/`, `models/Notification.js`.
- **Stroke replay demo** — `frontend/src/pages/StrokeReplayDemo.jsx` (demo page — keep out of student nav).

**Known gaps / risks called out by existing audits:**
- **No handwriting OCR.** Upload extraction reads PDF text + blueprints, not student handwriting.
  Any "auto-mark working from a photo" expectation is **not** implemented. Working evidence is
  captured and reviewed, not auto-graded.
- **MathPath evidence integrity not certified** for a 20–50 student parent pilot (per `00_REPO_AUDIT.md`):
  runtime evidence integrity, Recovery Pack question materialisation, misconception specificity, and
  recheck targeting still need hardening.
- **Working UX duplication** (per `ANSWER_WORKING_UX_AUDIT.md`): repeated `WorkingCanvas` +
  `WorkingEvidenceDecision` markup should be extracted into a shared `WorkingEvidencePanel`; no E2E
  yet for assessment working submission with confidence + evidence.
- **Postgres/Prisma migration** scaffolded but inactive (MongoDB is live).
- **Scope creep guard:** Secondary modules (Spelling, Science, LifeLab) and Secondary curriculum exist
  but must stay visibly secondary to MathPath Fractions.

---

## 5. Risks / Do Not Break

Hard constraints. Any change touching these must keep existing behaviour and tests green.

- **Working evidence chain.** Do not remove, rename, or rewrite `WorkingCanvas`,
  `FullScreenWorkingMode`, `WorkingEvidenceDecision`, `WorkingToolbar`/`drawingUtils`, the
  `working/` upload screens, or `workingAnalysisFramework.js`. Preserve full-screen save/restore and
  the paper-upload handoff exactly.
- **Upload workflow.** Keep the Multer consent-gated upload + `extractAssessmentMetadataFromBuffer`
  contract; don't change accepted MIME types or the consent requirement without intent.
- **Mistake-to-Mastery + recheck logic.** `fractionMistakeToMasteryEngine.js`,
  `recheckRecommendationService.js`, `masteryCriteriaEngine.js` are evidence-critical — no silent
  behaviour changes.
- **Evidence-not-activity rule.** Never let "reviewed/clicked/viewed" auto-promote to mastery.
- **Parent–child source of truth** is `StudentGuardian`; don't bypass it.
- **Claim safety.** No UI copy implying full P1–P6 coverage, guaranteed improvement, or "all weak
  areas found". Keep parent-facing language inside the approved claim set in `01_EXECUTIVE_OVERVIEW.md`.
- **No placeholder/roadmap UI** that exposes unfinished backend (school admin, teacher dashboard,
  notifications) to students/parents. Gate behind entitlements/flags until backed by real data.
- **Run before commit:** `npm --prefix frontend test` and `npm --prefix frontend run build`; backend
  `qa-pilot-preflight` / `qa-pilot-gate` scripts.

---

## 6. Recommended Next Sprint

Focused on Fractions evidence integrity (the audit's stated priority) + safely landing in-flight work.
See §8 for the prioritized checklist with acceptance criteria.

1. **Harden Fractions runtime evidence integrity** — make the diagnostic→mistake→recovery→recheck→growth
   chain produce trustworthy, materialised data end-to-end.
2. **Extract shared `WorkingEvidencePanel`** — de-duplicate `WorkingCanvas` + `WorkingEvidenceDecision`
   without changing behaviour; add the missing assessment-working E2E.
3. **Gate in-flight modules behind entitlements** — ensure Tutor/Teacher/School/Notifications are flag-
   gated and invisible to students/parents until data-backed.
4. **10-student seeded pilot simulation** — run the full loop on seeded weak P5/P6 profiles; capture a
   defects list.
5. **Parent-facing claim-safety audit** — sweep report/dashboard copy against the approved claim set.

---

## 7. Open Questions

1. Where are the three GTM/partnership `.docx` files? They were not in the workspace — needed before any
   GTM / partnerships / physical-hub section can be written.
2. Tutor vs Teacher dashboard priority — scope says Tutor is near-term and Teacher is future, but both
   have in-flight work. Which ships first?
3. Is the entitlements/billing tier model intended to gate the pilot, or only post-pilot? Affects whether
   it's sprint-critical now.
4. Target pilot size for the next milestone — staying at ~5–10 (audit-safe) or pushing toward 20–50
   (needs the §4 hardening first)?
5. Should `StrokeReplayDemo.jsx` and any demo routes be removed from the production bundle?

---

## 8. Prioritized Next-Work Checklist

| # | Pri | Task | Reason | Files likely involved | Acceptance criteria |
|---|-----|------|--------|-----------------------|---------------------|
| 1 | P0 | Verify Fractions evidence chain materialises end-to-end | Audit's #1 blocker for any real pilot; evidence must be real, not activity | `services/mathpath/fractionMistakeToMasteryEngine.js`, `recheckRecommendationService.js`, `masteryCriteriaEngine.js`, `misconceptionDetectionService.js`, `routes/diagnostics.js`, `routes/recovery.js` | Seeded weak student runs Diagnostic→Mistake→Recovery→Recheck→Growth with real records at each step; no step fabricates mastery; existing tests green |
| 2 | P0 | Confirm working-evidence flows unbroken after recent edits | `WorkingCanvas`/`FullScreenWorkingMode` changed 2026-06-09; these are the differentiator | `WorkingCanvas.jsx`, `FullScreenWorkingMode.jsx`, `WorkingEvidenceDecision.jsx`, `working/WorkingUpload*Screen.jsx` + their `.test.jsx` | `npm --prefix frontend test` passes for all `learning/` + `working/` tests; manual full-screen save/restore + paper-upload handoff verified |
| 3 | P1 | Extract shared `WorkingEvidencePanel` (no behaviour change) | Remove duplicated canvas+decision markup flagged in `ANSWER_WORKING_UX_AUDIT.md` | New `components/learning/WorkingEvidencePanel.jsx`; callers in practice/diagnostic/assessment/similar | Single panel reused by all 4 surfaces; visual + test parity with pre-refactor; build passes |
| 4 | P1 | Flag-gate in-flight modules (Tutor/Teacher/School/Notifications) | Prevent unfinished backend from showing as user-facing features | `middleware/entitlements.js`, `services/billing/entitlements.js`, `context/useEntitlements.js`, `config/nav.js`, `routes/schoolAdmin.js`, `routes/notifications.js` | Students/parents see none of these without entitlement; routes 403 without entitlement; nav hides gated items |
| 5 | P1 | Add E2E for assessment working submission (confidence + evidence) | Named follow-up in working UX audit; assessment path is highest-stakes | `frontend` Playwright pilot config + new spec; `AssessmentReviewScreen.jsx` | E2E asserts answer + confidence + working-evidence required before submit; runs in pilot gate |
| 6 | P2 | 10-student seeded pilot simulation + defect log | Audit-recommended gate before scaling beyond ~5 students | `scripts/seedPilotStudents.js`, `seedCadenP5WeakStudent.js`, `qa-pilot-preflight.js`, `qa-pilot-gate.js` | Script runs full loop for 10 profiles; produces pass/fail report + defect list artifact |
| 7 | P2 | Parent-facing claim-safety copy sweep | Avoid overclaiming mastery/coverage; audit constraint | parent dashboard pages, report components, `mathpath/dashboard/parentMathPathDashboardEngine.js` | No copy implies full P1–P6, guaranteed improvement, or "all weak areas found"; matches approved claim set |
| 8 | P3 | Remove/guard demo routes from prod bundle | `StrokeReplayDemo.jsx` should not ship to students | `frontend/src/pages/StrokeReplayDemo.jsx`, `App.jsx`, `config/nav.js` | Demo route absent from production build or behind dev/admin flag |

**Legend:** P0 = pilot-blocking, must verify first · P1 = this sprint · P2 = before scaling pilot · P3 = hygiene.

---

## 9. Verification Findings (2026-06-09 pass)

A first verification pass was run against the two P0 items. Summary: **no broken functionality found**;
two specific evidence-integrity soft-spots identified for sprint item #1.

### 9.1 Working-flow integrity (checklist #2) — PASS (static)

- The uncommitted edits to `WorkingCanvas.jsx` (−163 lines) and `FullScreenWorkingMode.jsx` (−170 lines)
  are a **refactor, not a deletion**: stroke/stamp/export drawing logic was extracted into the new
  shared `components/learning/drawingUtils.js`.
- `drawingUtils.js` exports every symbol the callers import
  (`CANVAS_WIDTH/HEIGHT`, `drawStroke`, `drawMathStamp`, `paintBackground`, `exportCanvas`,
  `pointFromEvent`, `beginStrokeData`, `finalizeStroke`, replay helpers). `WorkingCanvas`,
  `FullScreenWorkingMode`, and `StrokeReplayPlayer` all import from it correctly.
- Test entry points are intact: `WorkingCanvas.test.jsx` imports `WorkingCanvas` +
  `resolveWorkingRequirement` (both still exported); `FullScreenWorkingMode.test.jsx` imports the
  default export (present). This consolidation is the de-dup direction the UX audit recommended.
- **Caveat:** the suite could **not** be executed in this environment — the mounted `node_modules`
  was installed on macOS, rollup 4 (via vitest) needs a Linux native binary, and the sandbox npm
  registry is blocked (403). **Action required on your Mac before committing:**
  `npm --prefix frontend test -- src/components/learning` and `npm --prefix frontend run build`.
- `drawingUtils.js`, `StrokeReplayPlayer.jsx`, and the two edited components are **uncommitted** —
  commit only after the suite is green locally.

### 9.2 Fractions evidence chain (checklist #1) — SHAPE CORRECT, two soft-spots

What's good (keep): mastery is **recheck-gated**, not activity-granted —
`masteryCriteriaEngine.evaluateMasteryCriteria()` returns `readyForRecheck`, with discrete stages and
an explicit `evidence` object. A dedicated `fractionsRuntimeEvidenceIntegrityService.js` validates
misconception links exist, that misconception tags map to the target skill, and that intervention
questions carry misconception tags (emits severity-graded issues + status).
`crossEvidenceValidator.js` requires agreement across evidence signals before concluding a skill state.

Soft-spots to fix in sprint item #1 (these are permissiveness, not fabrication):

1. **`DEFAULT_MASTERY_CRITERIA` is permissive by default** (`masteryCriteriaEngine.js` ~line 53):
   `requiresMisconceptionResolved: false` and `requiresConfidenceImproved: false`. Unless a
   `learningPath.masteryCriteria` overrides them, a student can be marked `readyForRecheck` on
   accuracy + mastery-check alone, **without confirming the original misconception was resolved**.
   For the Fractions pilot, set these to `true` in the Fractions learning-path criteria.
2. **`inferCompletedStagesFromProgress()` can auto-complete `mastery_check` from activity**
   (`masteryCriteriaEngine.js` ~line 126): it marks `mastery_check` done when
   `questionsAttempted >= target` and `accuracy >= 70`. This is (a) weaker than the explicit 75%
   gate in `DEFAULT_MASTERY_CRITERIA`, and (b) the residual "activity → mastery" path the product
   principle warns against. Recommend requiring a discrete mastery-check event rather than inferring
   it, or at minimum aligning the threshold to 75%.

**Refined acceptance criteria for sprint item #1:** Fractions learning path sets
`requiresMisconceptionResolved: true`; `mastery_check` is not auto-inferred from attempt count;
`fractionsRuntimeEvidenceIntegrityService` reports zero high-severity issues on a seeded weak-student
run; mastery is reached only after a passing recheck on a different surface.

> **Clarification (important):** the §9.2 permissive path governs **learning-path stage completion /
> recheck-readiness** in `masteryCriteriaEngine.js` — a *different subsystem* from the per-mistake
> `learningStatus` shown to parents. The parent-facing "mastered/understood" badge
> (`MistakeCard.jsx`) is driven by `mistakeCorrectionFlow.js`'s gated progression
> (corrected → understood → mastered, each requiring a real correction/understanding check) and is
> actively **downgraded** by `fractionsRuntimeEvidenceIntegrityService` if mastery evidence is
> missing. So the parent badge is **not** fabricated from activity. Keep the two subsystems
> consistent: confirm `hasMasteryEvidence` requires a passing recheck/retention.

---

## 10. Review Pass — In-Flight Changes (2026-06-09)

Reviewed the uncommitted working tree against the §5 do-not-break list. **No regressions in current
file state.** Note: this reviewed *current state*, not per-line deltas for every file.

**PASS:**
- **Evidence schema is additive-only** — no field removals. `Mistake.js` adds a `tutorExplanation`
  sub-doc; `User.js` adds the `school_admin` role; `StudentGuardian.js` adds `accessLevel`
  (`full`/`view_only`, default `full`) + `source`. Defaults preserve existing behaviour.
- **`StudentGuardian` scoping intact** — `routes/mistakes.js` still resolves via `resolveStudent(req)`;
  it also added a `source` filter (advances the triage E2 fluency-vs-fractions fix).
- **No F-code leakage** — parent `MistakeCard.jsx` renders `skillName`/`topicName` + friendly status
  labels, never raw `misconceptionTag`.
- **Nav stays flag-gated** — `config/nav.js` delegates to `buildNav({ featureFlags, role })`.
- **Working refactor consistent** — `StrokeReplayPlayer` (on the new `drawingUtils`) is reused via
  lazy import in `MistakeCard`.

**FLAG — `accessLevel: 'view_only'` declared but not enforced.** It is assigned for school invites
(`routes/parentInvites.js`) and referenced in `services/billing/entitlements.js`, but **no write route
gates on it** — a `view_only` school-invited parent could still hit assign-practice / edit endpoints.
Existing `full`-default users are unaffected, so this is not a regression, but the school-invite view-only
promise is unenforced. **Action:** wire `accessLevel` enforcement into guardian write paths *before*
exposing the school-invite flow, or keep the school-invite/`admin/school` UI flag-gated until then.

**Process note:** the in-flight batch (~22 modified + several new files) is uncommitted and untested in
this environment. Run `npm --prefix frontend test` + `npm --prefix frontend run build` on macOS before
committing — the WorkingCanvas/`drawingUtils` refactor touches the most-protected component.

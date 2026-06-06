# Executive Summary

Updated verdict, June 6, 2026: **B. Fractions pilot-ready for baseline/history/growth reporting, with remaining hardening gaps.**

Tian OS now has a productized adaptive diagnostic foundation for MathPath Fractions. The live diagnostic path starts one question at a time, records responses, stores decision history, uses confidence/timing/skip/working signals, blocks inappropriate baseline replays through policy, and now preserves diagnostic lineage through top-level baseline/history fields.

The previous critical gaps are materially reduced. `MathPathDiagnosticSession` now stores `diagnosticPurpose`, `attemptNumber`, `isBaseline`, `baselineDiagnosticId`, `previousDiagnosticId`, and `perSkillSnapshot`. The generic diagnostic API now exposes `/api/diagnostics/history` and `/api/diagnostics/growth`, with compatibility routes under `/api/mastery/diagnostic/history` and `/api/mastery/diagnostic/growth`. The growth service returns baseline/latest/previous, readiness deltas, per-skill improvement, confidence trend, timing trend, working-evidence trend, and assignment-linked recheck growth where available.

Adult surfaces now consume diagnostic growth more directly. Parent, tutor, and teacher MathPath dashboards load diagnostic growth data and show compact diagnostic growth cards. The admin pilot intervention dashboard also summarizes baseline/latest readiness and intervention-linked growth.

Pilot readiness for a 5-student Fractions run is now reasonable for initial placement, intervention assignment, recheck, and quantified diagnostic growth. The remaining gaps are mostly hardening and breadth: multi-domain coverage, formal intervention-window attribution, stronger production baseline immutability semantics, fuller student-facing trend UI, and cleanup of the legacy batch diagnostic submit path.

## June 6 Implementation Update

| Area | Current status |
| --- | --- |
| Baseline preservation | Implemented for completed diagnostics through `isBaseline`, `baselineDiagnosticId`, `previousDiagnosticId`, and attempt numbering. |
| Diagnostic history | Implemented through `GET /api/diagnostics/history` and MathPath compatibility route. |
| Diagnostic growth API | Implemented through `GET /api/diagnostics/growth`, including readiness, per-skill, confidence, timing, and working-evidence trends. |
| Per-skill snapshots | Implemented at diagnostic completion via `perSkillSnapshot`. |
| Adult dashboard growth panels | Implemented in parent, tutor, and teacher MathPath dashboards through `DiagnosticGrowthCard`. |
| Pilot intervention reporting | Implemented in admin pilot intervention metrics, including baseline/latest readiness and targeted-skill gain. |
| Intervention workflows | Recovery Packs, rechecks, tutor lesson prep, student care queues, teacher weak groups, partner/centre reporting, and intervention worksheets now exist. |
| Remaining gap | Domain breadth, formal intervention-window attribution, legacy submit unification, and production baseline reset/migration policy. |

# Findings

## Part 1 - Diagnostic Availability

### Diagnostic Inventory

| Area | Files / Collections | Current role |
| --- | --- | --- |
| Generic diagnostic API | `routes/diagnostics.js` | Registry-backed endpoints for domain listing, start, and live answer submission. |
| Backward-compatible MathPath API | `routes/mastery.js` | Fractions diagnostic start/answer/latest/session endpoints plus legacy batch submit endpoint. |
| Runtime service | `services/diagnostics/diagnosticRuntime.js` | Starts adaptive diagnostic sessions, enforces replay policy, scores answers, persists attempts/mistakes, stores decision history. |
| Domain registry | `services/diagnostics/diagnosticDomainRegistry.js` | Registers available diagnostic domains. Currently only Fractions is registered. |
| Fractions adapter | `services/diagnostics/domains/fractionsDiagnosticDomain.js` | Fractions skill/question loading, mode selection, question normalization, scoring, result shaping. |
| Replay policy | `utils/diagnosticReplayPolicy.js` | Controls baseline retake/recheck policy. |
| Decision engine | `utils/adaptiveDiagnosticDecisionEngine.js` | Domain-agnostic adaptive decision logic. |
| Next-question selector | `utils/selectNextDiagnosticQuestion.js` | Metadata-driven next item selection. |
| Diagnostic session model | `models/mathpath/MathPathDiagnosticSession.js` / `mathpath_diagnostic_sessions` | Stores session, adaptive state, decision history, readiness, result payload, timestamps. |
| Attempts model | `models/mathpath/MathPathAttempt.js` / `mathpath_attempts` | Stores per-question answer, confidence, timing, working evidence and session linkage. |
| Student diagnostic UI | `frontend/src/pages/student/mathpath/diagnostic/*` | Intro, live question screen, result screen. |
| Student entry points | `frontend/src/pages/student/mathpath/MathPathHome.jsx`, `frontend/src/pages/student/StudentDashboard.jsx` | Start diagnostic and re-check entry points. |
| Adult dashboards | `frontend/src/pages/parent/ParentMathPathDashboardPage.jsx`, `frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx`, `frontend/src/pages/teacher/TeacherMathPathDashboardPage.jsx` | Latest placement, weak skills, working insights, and dashboard summaries. |
| Outcome tracking | `models/mathpath/OutcomeTracking.js`, `services/mathpath/outcomeTrackingEngine.js` | Before/current summary snapshots, but not diagnostic-session history. |

### How a Student Starts a Diagnostic

| File | Function / component | Current behaviour | Recommended fix |
| --- | --- | --- | --- |
| `frontend/src/pages/student/mathpath/MathPathHome.jsx:147` | `startDiagnostic()` | Navigates to `/student/mathpath/diagnostic` with `diagnosticPurpose` in route state. Default is `baseline`; recheck is passed explicitly from CTA. | Keep, but make diagnostic purpose visible and durable via route/query param if adult-assigned diagnostics are added. |
| `frontend/src/pages/student/mathpath/diagnostic/DiagnosticIntroScreen.jsx:58` | `startDiagnostic()` | Calls `mathpathAPI.startDiagnostic({ requestedMode, studentLevel, diagnosticPurpose })`, then routes to `/student/mathpath/diagnostic/session/:id`. | Keep adaptive flow; add explicit “baseline vs re-check” labels in persisted session and history UI. |
| `frontend/src/services/api.js:58` | `diagnosticsAPI.startDiagnostic()` | Generic endpoint exists: `POST /api/diagnostics/start`. | Use this for all future domains; avoid adding new subject-specific start routes. |
| `routes/diagnostics.js:28` | `POST /api/diagnostics/start` | Registry-backed generic start endpoint. | Add domain availability UI and route-level history support. |
| `routes/mastery.js:1100` | `POST /api/mastery/diagnostic/start` | Backward-compatible Fractions endpoint delegates to `startAdaptiveDiagnostic`. | Keep for compatibility, but prefer generic endpoint in new UI/services. |

### Retake / Locking / Reassessment

| Question | Current answer |
| --- | --- |
| Can a diagnostic be retaken? | **Partially.** `diagnosticPurpose` supports `baseline`, `recheck`, and `assigned`. Recheck/assigned are allowed by policy. |
| Does completion lock the session? | **Yes.** `answerAdaptiveDiagnostic()` only loads sessions with `status: 'inProgress'`, so completed sessions cannot continue receiving answers. |
| Can baseline be repeated? | **Guarded.** `evaluateDiagnosticReplayPolicy()` blocks recent baseline replay unless there is no prior diagnostic, corrupted placement, long inactivity, or recheck need. |
| Do reassessment diagnostics exist? | **Partially.** The runtime supports `recheck` and `assigned`, and MathPath Home shows “Run Check-In Again” in some states. There is no full reassessment management UI/history. |
| Is a diagnostic available for every topic/domain? | **No.** Only `math/fractions` is registered in `diagnosticDomainRegistry.js`. |
| Is there UI preventing repeated diagnostic use? | **Partially.** Backend replay policy blocks baseline retakes; frontend can surface the API error. Recheck CTA appears conditionally. |

### Diagnostic Availability Issues

| File | Function/component | Current behaviour | Recommended fix |
| --- | --- | --- | --- |
| `services/diagnostics/diagnosticDomainRegistry.js:45` | `registerDiagnosticDomain(fractionsDiagnosticDomain)` | Only Fractions is registered. | Add registry entries for each domain only when skill graph and question bank are ready; expose unavailable state in UI. |
| `services/diagnostics/domains/fractionsDiagnosticDomain.js:6` | `DIAG_MODE_RANGES` | Fractions diagnostic modes are hard-bounded to F001-F005/F019/F026. | Acceptable for Fractions adapter; keep domain-specific ranges out of generic engine. |
| `services/diagnostics/domains/fractionsDiagnosticDomain.js:203` | `selectInitialQuestions()` | Samples a candidate pool from seeded Questions; still domain-specific. | Good enough for Fractions, but future domains need adapters with equivalent metadata. |
| `utils/diagnosticReplayPolicy.js:37` | `evaluateDiagnosticReplayPolicy()` | Recheck/assigned allowed; baseline guarded. | Add explicit `baselineDiagnosticId` and `diagnosticAttemptNumber` to make policy auditable. |
| `frontend/src/pages/student/mathpath/diagnostic/DiagnosticIntroScreen.jsx:37` | `diagnosticPurpose` state | Diagnostic purpose is route state, not URL-durable. | Use query param or explicit route state hydration if users refresh/enter directly. |
| `routes/mastery.js:1147` | legacy `submit` endpoint | Legacy batch submit path still exists and computes a simple readiness score. | Either deprecate or wrap it so all diagnostics use the adaptive answer endpoint and shared result builder. |

## Part 2 - Baseline Preservation

### Storage Facts

| File | Evidence | Meaning |
| --- | --- | --- |
| `models/mathpath/MathPathDiagnosticSession.js:8` | `diagnosticSessionId` required and unique indexed. | Every diagnostic session has a durable session identifier. |
| `models/mathpath/MathPathDiagnosticSession.js` | Stores `studentId`, `subjectId`, `domainId`, `mode`, `diagnosticPurpose`, `attemptNumber`, `isBaseline`, `baselineDiagnosticId`, `previousDiagnosticId`, `status`, `decisionHistory`, `assignedPracticeSkillIds`, `readinessScore`, `perSkillSnapshot`, `adaptiveState`, `result`, `startedAt`, `completedAt`. | Session-level diagnostic evidence, baseline lineage, and per-skill snapshots are preserved. |
| `services/diagnostics/diagnosticRuntime.js:409` | Creates a new `MathPathDiagnosticSession` on start. | Later diagnostics should create new documents, not overwrite the original session document. |
| `services/diagnostics/diagnosticRuntime.js:579` | Appends response records into `adaptiveState.responses`. | Per-question diagnostic evidence is stored in the session. |
| `services/diagnostics/diagnosticRuntime.js:756` | Appends `decisionHistory`. | Adaptive routing history is preserved. |
| `models/mathpath/MathPathAttempt.js:13-27` | Stores student/session/question/skill/correctness/time. | Question-attempt history can be reconstructed by `sessionId`. |
| `models/mathpath/MathPathAttempt.js:43-68` | Stores confidence, reflection, help, skip, timing, and working evidence fields. | Diagnostic evidence is rich enough for growth analytics. |

### Baseline Questions

| Question | Answer |
| --- | --- |
| Is the first diagnostic stored permanently? | **Yes for normal product flow.** The first completed diagnostic per student/domain is marked with `isBaseline` and its own `baselineDiagnosticId`. Production reset/backfill policy still needs explicit operational documentation. |
| Can later diagnostics overwrite the baseline? | **No at the session-document level.** Later diagnostics create new session documents and link back to the baseline through `baselineDiagnosticId` and `previousDiagnosticId`. |
| Is there a `baselineDiagnosticId` or equivalent? | **Yes.** `baselineDiagnosticId` is stored on diagnostic sessions and returned by history/growth APIs. |
| Can historical growth be reconstructed? | **Yes as a first-class API for completed diagnostics.** `/api/diagnostics/history` and `/api/diagnostics/growth` return diagnostic attempts, baseline/latest/previous, readiness deltas, and per-skill trends. |

### Baseline Preservation Issues

| File | Function/component | Current behaviour | Remaining fix |
| --- | --- | --- | --- |
| `models/mathpath/MathPathDiagnosticSession.js` | schema | Baseline/history fields and `perSkillSnapshot` now exist. | Add migration/backfill for older sessions if production data predates this schema. |
| `services/diagnostics/diagnosticRuntime.js` | session creation/completion | Creates lineage fields and applies completion metadata with per-skill snapshots. | Add operational policy for reset/backfill and abandoned in-progress sessions. |
| `routes/diagnostics.js` / `routes/mastery.js` | history/growth endpoints | Generic and compatibility history/growth routes now exist. | Prefer generic routes in new UI and gradually retire subject-specific compatibility paths. |
| `models/mathpath/OutcomeTracking.js` | baselineDate | Still tracks outcome snapshots separately. | Keep diagnostic before/after reporting sourced from diagnostic growth API or explicitly link outcome records to diagnostics. |

## Part 3 - Before vs After Reporting

### Required Data Availability

| Required field per diagnostic | Current status | Evidence |
| --- | --- | --- |
| Timestamp | **Exists** | `startedAt`, `completedAt`, `createdAt`, `updatedAt` in `MathPathDiagnosticSession`. |
| Skill scores | **Exists** | `perSkillSnapshot` stores per-skill questions answered, correct count, score, confidence, timing, working rate, misconception tags, and evidence question IDs. |
| Readiness score | **Exists per session** | `MathPathDiagnosticSession.readinessScore`, `result.overallFractionReadinessScore`. |
| Confidence score | **Exists for growth reporting** | `diagnosticGrowthService` aggregates confidence from per-skill snapshots. |
| Working evidence | **Exists per attempt** | `MathPathAttempt` working fields and adaptive response `workingSubmitted`. |
| Time taken | **Exists per attempt** | `timeTaken`, `timeSpentSeconds`, `questionStartedAt`, `questionEndedAt`, response `timeTakenMs`. |
| Improvement calculation | **Exists for completed diagnostics** | `GET /api/diagnostics/growth` returns readiness and per-skill before/current deltas. |

### Current Reporting Behaviour

| File | Current behaviour | Remaining gap |
| --- | --- | --- |
| `frontend/src/pages/student/mathpath/diagnostic/DiagnosticResultScreen.jsx` | Fetches one diagnostic by session ID and shows current result. | Add a student-friendly progress-over-time view after rechecks. |
| `routes/diagnostics.js` | Exposes history and growth APIs. | Continue using generic routes for new domains. |
| `routes/mastery.js` | Provides latest plus compatibility history/growth routes. | Retire or wrap the legacy batch submit path. |
| `services/diagnostics/diagnosticGrowthService.js` | Builds baseline/latest/previous, per-skill trends, confidence/timing/working trends, and assignment-linked growth. | Add formal intervention-window attribution. |

### Can the Example Be Generated Automatically?

Example:

`Equivalent Fractions Before: 42%, After: 83%, Improvement: +41`

Current answer: **Yes, when both diagnostics include enough evidence for that skill.**

The raw ingredients likely exist if:

1. both diagnostics are completed,
2. each session has enough responses for that skill,
3. per-skill scores are reconstructed from `adaptiveState.responses` or `MathPathAttempt`, and
4. the reporting layer defines which diagnostic is “before” and which is “after”.

Tian OS now has a stable diagnostic growth API that returns per-skill growth rows with `{ skillId, beforeScore, currentScore, improvement, status }`. The remaining limitation is evidence density: a skill needs enough diagnostic responses across the compared attempts to make the number meaningful.

## Part 4 - Growth History

Question: does Tian OS support Student Diagnostic #1, #2, #3, #4 and trend graphs?

Verdict: **Supported for completed Fractions diagnostics; trend UI remains compact.**

Why:

- Multiple diagnostic sessions can exist because `startAdaptiveDiagnostic()` creates new `MathPathDiagnosticSession` documents.
- Sessions preserve timestamps, response evidence, readiness scores, decisions, and result payloads.
- The app has latest-diagnostic, individual-session, history, and growth endpoints.
- Completed sessions now have attempt numbering, baseline linkage, and per-skill snapshots.
- Adult dashboards show compact growth cards; fuller student and class trend charts remain future work.

| Capability | Status | Notes |
| --- | --- | --- |
| Store diagnostic #1/#2/#3/#4 | Supported | Multiple completed session documents are queryable through history. |
| Identify first diagnostic as baseline | Supported | Uses `isBaseline` and `baselineDiagnosticId`. |
| Identify intervention window | Missing | Practice/remediation events exist but are not grouped between diagnostic attempts. |
| Generate readiness trend graph | Partial | API data exists; adult UI shows compact card rather than full graph. |
| Generate skill-level before/after trend | Supported | `perSkillGrowth` returns before/current/improvement per skill. |
| Generate confidence trend | Supported | Growth API returns baseline/latest confidence trend. |
| Generate working-evidence trend | Supported | Growth API returns baseline/latest working-submitted rate. |

## Part 5 - Adult Dashboards

### Parent Dashboard

| File | Current capability | Remaining capability |
| --- | --- | --- |
| `frontend/src/pages/parent/ParentMathPathDashboardPage.jsx` | Loads mastery, latest diagnostic, diagnostic growth, working review, and fluency. | Add richer drill-down timeline and worksheet CTA from growth. |
| `frontend/src/components/mathpath/DiagnosticGrowthCard.jsx` | Shows baseline/latest readiness, improvement, remaining weak skill, and top improved skill. | Add more detailed per-skill trend table when needed. |
| `frontend/src/mathpath/dashboard/parentMathPathDashboardEngine.js:116` | Assessment summary can compare latest vs previous assessment result. | This is assessment-oriented, not diagnostic baseline reporting. |
| `frontend/src/mathpath/dashboard/parentMathPathDashboardEngine.js:268` | Weaknesses combine mastery, assessment, and mistakes. | Does not identify diagnostic improvement by skill. |

### Tutor Dashboard

| File | Current capability | Remaining capability |
| --- | --- | --- |
| `frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx` | Loads latest diagnostic, diagnostic growth, working review, fluency, and retention. | Add fuller diagnostic attempt timeline and direct worksheet/recheck actions from the card. |
| `frontend/src/components/mathpath/DiagnosticGrowthCard.jsx` | Provides compact before/current/improvement evidence. | Add tutor-specific lesson-prep handoff from weak growth skills. |
| `frontend/src/mathpath/dashboard/tutorMathPathDashboardEngine.js` | Consumes weak skill IDs and readiness. | Keep growth API as primary source for diagnostic trend reporting. |

### Teacher Dashboard

| File | Current capability | Remaining capability |
| --- | --- | --- |
| `frontend/src/pages/teacher/TeacherMathPathDashboardPage.jsx` | Loads per-student diagnostic growth rows and builds class diagnostic growth. | Add richer class-level growth trend charts and exports. |
| `frontend/src/components/mathpath/DiagnosticGrowthCard.jsx` | Reused for compact class/student growth evidence. | Add direct teacher weak-group handoff from growth rows. |
| `frontend/src/mathpath/dashboard/teacherMathPathDashboardEngine.js` | Builds class readiness summaries. | Keep diagnostic growth API as the class before/after source. |

### Admin / Pilot Dashboard

| File | Current capability | Remaining capability |
| --- | --- | --- |
| `routes/pilotAnalytics.js`, `services/mathpath/pilotInterventionMetricsService.js` | Exposes pilot intervention metrics including baseline/latest readiness, readiness gain, and targeted skill gain. | Add exportable founder/pilot report package. |
| `frontend/src/pages/admin/PilotInterventionsPage.jsx` | Shows intervention queues, Recovery Packs, rechecks, paper-review status, and growth summary. | Add more granular per-student drill-down and report export. |

# Risks

1. **Production baseline immutability** - Baseline fields now exist, but production reset/backfill policy still needs explicit migration and operational rules.
2. **Legacy diagnostic submit path** - `routes/mastery.js` still has a batch submit endpoint that computes simple readiness and could diverge from the adaptive diagnostic result model.
3. **Domain coverage risk** - The registry is generic, but only Fractions is registered; diagnostics are not available for every topic/domain.
4. **Intervention attribution** - Recovery Packs, worksheets, paper analysis, tutor prep, teacher weak groups, and rechecks now exist, but the system still does not formally model an intervention window with attribution confidence.
5. **Latest-result bias in older surfaces** - New growth APIs and cards exist, but older summary proxies and outcome-tracking paths can still emphasize latest results.
6. **Outcome tracking mismatch** - `OutcomeTracking` can still be assessment-derived in places; diagnostic growth now exists separately and should be the primary source for diagnostic before/after.
7. **Student-facing trend UX** - Adult growth panels exist, but the student-facing progress-over-time experience remains lighter than adult reporting.
8. **Partner/centre access breadth** - Partner scoping is now wired into core student access paths, tutor/student-care/teacher student routes, paper analysis, assignments, and reports, but should continue to be audited as new routes are added.
9. **Content metadata dependency** - Skill-level growth, worksheet generation, and paper-analysis mapping depend on stable F-code/question metadata.
10. **Test account reset can erase baseline** - Test reset intentionally deletes diagnostic state; acceptable for QA, but production baseline preservation needs explicit semantics.

# Remaining Features

Top remaining items, priority order:

1. Production migration/backfill for legacy completed diagnostic sessions so baseline fields are populated consistently.
2. Explicit immutable-baseline operational policy for production resets, archived pilots, and support workflows.
3. Formal intervention-window model linking baseline diagnostic, assigned intervention, activity evidence, and after diagnostic.
4. Student-friendly diagnostic progress-over-time view.
5. Registry expansion beyond Fractions when skill graphs and diagnostic banks are ready.
6. Deprecation or unification of the legacy batch diagnostic submit route.
7. Direct worksheet-generation CTA from diagnostic growth cards.
8. Richer class/centre-level diagnostic growth trend exports.
9. Ongoing quality audit for F-code mappings, diagram requirements, and misconception coverage.
10. Partner/centre report event model so generated parent reports and impact reports can be counted directly.

# Recommended Next Steps

## Pilot Readiness Verdict

**B. Fractions pilot-ready**, with hardening gaps remaining.

For a 5-student Fractions pilot focused on initial placement, intervention assignment, paper-analysis support, Recovery Packs, worksheets, rechecks, and diagnostic growth, the system is now usable. It can show a clean baseline/latest diagnostic comparison and intervention-informed growth for pilot reporting.

## Phase 1 - Completed

Goal: Preserve baseline and expose diagnostic history without changing the student experience heavily.

Likely files:

- `models/mathpath/MathPathDiagnosticSession.js`
- `services/diagnostics/diagnosticRuntime.js`
- `routes/diagnostics.js`
- `routes/mastery.js`
- `frontend/src/services/api.js`
- New tests in `utils/diagnosticRuntime.test.js` or `routes/diagnostics.test.js`

Status:

1. Added top-level fields:
   - `diagnosticPurpose`
   - `attemptNumber`
   - `isBaseline`
   - `baselineDiagnosticId`
   - `previousDiagnosticId`
2. First completed diagnostic per student/domain is marked as baseline.
3. Later diagnostics link back to the baseline and previous diagnostic.
4. Added `GET /api/diagnostics/history?subjectId=&domainId=&studentId=`.
5. Added compatibility history routes and diagnostic growth service tests.

Complexity: **Medium**

Dependencies: existing session collection; replay policy; auth/student resolution.

## Phase 2 - Mostly Completed

Goal: Produce actual Before -> After reporting.

Likely files:

- New service: `services/diagnostics/diagnosticGrowthService.js`
- `routes/diagnostics.js`
- `frontend/src/pages/student/mathpath/diagnostic/DiagnosticResultScreen.jsx`
- `frontend/src/pages/parent/ParentMathPathDashboardPage.jsx`
- `frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx`
- `frontend/src/pages/teacher/TeacherMathPathDashboardPage.jsx`
- `services/mathpath/outcomeTrackingEngine.js`

Status:

1. Stores per-skill diagnostic snapshots at completion:
   - skillId
   - questionsAnswered
   - correct
   - score
   - confidenceScore
   - avgTimeTaken
   - workingSubmittedRate
   - misconceptionTags
2. Added `GET /api/diagnostics/growth`.
3. Returns:
   - baseline
   - latest
   - overall readiness improvement
   - per-skill improvement
   - confidence calibration change
   - working evidence change
4. Updated parent, tutor, and teacher dashboards with compact growth panels.
5. Added admin pilot intervention growth reporting.

Remaining:

1. Add formal intervention-window attribution.
2. Add a fuller student-facing trend view.
3. Add migration/backfill for older diagnostic sessions.

Complexity: **Medium to High**

Dependencies: Phase 1 baseline IDs; stable scoring shape.

## Phase 3 - Future

Goal: Make diagnostic growth domain-wide and multi-subject.

Likely files:

- `services/diagnostics/diagnosticDomainRegistry.js`
- Domain adapters under `services/diagnostics/domains/`
- Skill graph/question-bank metadata for future domains
- Teacher/class analytics components

Work:

1. Register more domains when their skill graphs and diagnostic banks are ready.
2. Add class-level diagnostic growth trends.
3. Add intervention-window analytics:
   - before diagnostic
   - practice/remediation events
   - after diagnostic
   - growth attribution
4. Add exportable parent/tutor progress report.

Complexity: **High**

Dependencies: domain content readiness; telemetry consistency; adult dashboard UX.

## Implementation Notes

Do not make the diagnostic engine subject-specific. Keep the current split:

- Diagnostic engine = generic decision machine.
- Domain registry = subject/domain adapter.
- Skill graph = domain knowledge.
- Question bank = item metadata.
- Student model/session = evidence and history.

The next build should avoid hardcoding Fractions growth logic. Fractions should be the first domain using a generic diagnostic baseline and growth service.

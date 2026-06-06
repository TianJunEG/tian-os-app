# Executive Summary

Verdict: **C. Significant gaps remain** for full Before -> Intervention -> After diagnostic measurement.

Tian OS now has a strong adaptive diagnostic foundation for MathPath Fractions. The live diagnostic path starts one question at a time, records responses, stores decision history, uses confidence/timing/skip/working signals, and can block baseline retakes through a replay policy. However, the platform does **not yet fully productize diagnostic baseline preservation, diagnostic history, or before/after growth reporting**.

The first diagnostic is stored as a `MathPathDiagnosticSession`, and later diagnostic sessions should not overwrite that document. But there is no explicit immutable `baselineDiagnosticId`, no first-class diagnostic history API, no automatic before/after diagnostic comparison, and adult dashboards mostly consume the latest diagnostic or summary proxies rather than a structured growth timeline.

The current outcome tracking model supports before/after summaries for mastery, fluency, retention, assessment, and readiness, but it does not directly import or aggregate `MathPathDiagnosticSession`. Its readiness baseline appears to be assessment-derived, not diagnostic-derived.

Pilot readiness for a single Fractions baseline and practice placement is reasonable. Pilot readiness for showing quantified diagnostic growth after intervention is incomplete.

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
| `models/mathpath/MathPathDiagnosticSession.js:9-31` | Stores `studentId`, `subjectId`, `domainId`, `mode`, `status`, `decisionHistory`, `assignedPracticeSkillIds`, `readinessScore`, `adaptiveState`, `result`, `startedAt`, `completedAt`. | Session-level diagnostic evidence is preserved. |
| `services/diagnostics/diagnosticRuntime.js:409` | Creates a new `MathPathDiagnosticSession` on start. | Later diagnostics should create new documents, not overwrite the original session document. |
| `services/diagnostics/diagnosticRuntime.js:579` | Appends response records into `adaptiveState.responses`. | Per-question diagnostic evidence is stored in the session. |
| `services/diagnostics/diagnosticRuntime.js:756` | Appends `decisionHistory`. | Adaptive routing history is preserved. |
| `models/mathpath/MathPathAttempt.js:13-27` | Stores student/session/question/skill/correctness/time. | Question-attempt history can be reconstructed by `sessionId`. |
| `models/mathpath/MathPathAttempt.js:43-68` | Stores confidence, reflection, help, skip, timing, and working evidence fields. | Diagnostic evidence is rich enough for growth analytics. |

### Baseline Questions

| Question | Answer |
| --- | --- |
| Is the first diagnostic stored permanently? | **Stored, but not explicitly protected as baseline.** The first diagnostic session remains in `mathpath_diagnostic_sessions` unless reset/deleted, but there is no immutable baseline marker or baseline pointer. |
| Can later diagnostics overwrite the baseline? | **Not directly at the session-document level.** New adaptive starts create new sessions. However, latest-placement APIs and outcome snapshots can hide or replace baseline context. |
| Is there a `baselineDiagnosticId` or equivalent? | **No.** No `baselineDiagnosticId` was found in models/routes/services. `OutcomeTracking` has `baselineDate` and baseline scores, but not a diagnostic session pointer. |
| Can historical growth be reconstructed? | **Partially.** It can be reconstructed from diagnostic sessions sorted by `completedAt` plus attempts by `sessionId`, but this is not exposed as a first-class API/report. |

### Baseline Preservation Issues

| File | Function/component | Current behaviour | Recommended fix |
| --- | --- | --- | --- |
| `models/mathpath/MathPathDiagnosticSession.js` | schema | No `diagnosticPurpose`, `attemptNumber`, `baselineDiagnosticId`, or immutable baseline flag at top level. Purpose is stored inside `result`. | Add top-level `diagnosticPurpose`, `attemptNumber`, `isBaseline`, and `baselineDiagnosticId`/`baselineOfDomainId`. |
| `services/diagnostics/diagnosticRuntime.js:440` | session creation | Stores `diagnosticPurpose` under `result`, not as queryable top-level field. | Move/copy purpose to top-level schema field for reporting and indexes. |
| `routes/mastery.js:1501` | `GET /api/mastery/diagnostic/latest` | Returns latest completed diagnostic only. | Add `/api/diagnostics/history` and `/api/diagnostics/growth` endpoints. |
| `models/mathpath/OutcomeTracking.js:7` | `baselineDate` | Tracks a baseline snapshot date but not source diagnostic ID. | Add `baselineDiagnosticId` and `latestDiagnosticId` if using this model for diagnostic growth. |
| `services/mathpath/outcomeTrackingEngine.js:188` | `getCurrentAssessmentMetrics()` | Reads `MathPathAssessmentSession`, not `MathPathDiagnosticSession`. | Add diagnostic-specific growth collection or extend outcome tracking to consume diagnostic sessions. |

## Part 3 - Before vs After Reporting

### Required Data Availability

| Required field per diagnostic | Current status | Evidence |
| --- | --- | --- |
| Timestamp | **Exists** | `startedAt`, `completedAt`, `createdAt`, `updatedAt` in `MathPathDiagnosticSession`. |
| Skill scores | **Partial** | Result contains mastered/weak skills and response evidence; no stable per-skill score table for every diagnostic attempt. |
| Readiness score | **Exists per session** | `MathPathDiagnosticSession.readinessScore`, `result.overallFractionReadinessScore`. |
| Confidence score | **Partial** | Per-attempt confidence exists; result screen derives confidence score. Needs stable aggregate per diagnostic. |
| Working evidence | **Exists per attempt** | `MathPathAttempt` working fields and adaptive response `workingSubmitted`. |
| Time taken | **Exists per attempt** | `timeTaken`, `timeSpentSeconds`, `questionStartedAt`, `questionEndedAt`, response `timeTakenMs`. |
| Improvement calculation | **Partial/manual** | Outcome engine calculates growth snapshots, but diagnostic-specific before/after comparison is not first-class. |

### Current Reporting Behaviour

| File | Current behaviour | Gap |
| --- | --- | --- |
| `frontend/src/pages/student/mathpath/diagnostic/DiagnosticResultScreen.jsx:70` | Fetches one diagnostic by session ID and shows current result. | No comparison to baseline or previous diagnostic. |
| `frontend/src/pages/student/mathpath/diagnostic/DiagnosticResultScreen.jsx:142` | Shows readiness score and questions correct for that session. | Does not show before/after deltas. |
| `routes/mastery.js:1507` | Fetches latest completed diagnostic. | Adult/student dashboards mostly see latest placement, not diagnostic history. |
| `services/mathpath/outcomeTrackingEngine.js:271` | Can calculate before/current gains for outcome records. | Baseline source is a snapshot and assessment-derived readiness, not diagnostic session comparison. |
| `services/mathpath/outcomeTrackingEngine.js:431` | Builds readiness growth with before/after/gain. | Useful structure exists but not wired to diagnostic history. |

### Can the Example Be Generated Automatically?

Example:

`Equivalent Fractions Before: 42%, After: 83%, Improvement: +41`

Current answer: **Not reliably as a product feature.**

The raw ingredients likely exist if:

1. both diagnostics are completed,
2. each session has enough responses for that skill,
3. per-skill scores are reconstructed from `adaptiveState.responses` or `MathPathAttempt`, and
4. the reporting layer defines which diagnostic is “before” and which is “after”.

But Tian OS does not yet have a stable diagnostic growth API that returns `{ skillId, beforeScore, afterScore, improvement }` across attempts.

## Part 4 - Growth History

Question: does Tian OS support Student Diagnostic #1, #2, #3, #4 and trend graphs?

Verdict: **Partially supported.**

Why:

- Multiple diagnostic sessions can exist because `startAdaptiveDiagnostic()` creates new `MathPathDiagnosticSession` documents.
- Sessions preserve timestamps, response evidence, readiness scores, decisions, and result payloads.
- The app has a latest-diagnostic endpoint and individual-session endpoint.
- There is no first-class diagnostic history endpoint, no baseline/latest pair API, no diagnostic trend chart component, and no explicit attempt numbering.

| Capability | Status | Notes |
| --- | --- | --- |
| Store diagnostic #1/#2/#3/#4 | Partial | Multiple session documents are possible. |
| Identify first diagnostic as baseline | Missing | Needs explicit baseline pointer/flag. |
| Identify intervention window | Missing | Practice/remediation events exist but are not grouped between diagnostic attempts. |
| Generate readiness trend graph | Missing | Data can be reconstructed but no API/UI. |
| Generate skill-level before/after trend | Missing | Needs per-skill scoring per diagnostic attempt. |
| Generate confidence trend | Partial | Per-attempt confidence exists; no diagnostic aggregate/history API. |
| Generate working-evidence trend | Partial | Working evidence exists; no diagnostic growth view. |

## Part 5 - Adult Dashboards

### Parent Dashboard

| File | Current capability | Missing capability |
| --- | --- | --- |
| `frontend/src/pages/parent/ParentMathPathDashboardPage.jsx:434` | Loads mastery, latest diagnostic, working review, and fluency. | Does not load full diagnostic history or before/after diagnostic comparison. |
| `frontend/src/pages/parent/ParentMathPathDashboardPage.jsx:498` | Shows latest placement recommendation. | No “Before Diagnostic / Current Diagnostic / Improvement” view. |
| `frontend/src/mathpath/dashboard/parentMathPathDashboardEngine.js:116` | Assessment summary can compare latest vs previous assessment result. | This is assessment-oriented, not diagnostic baseline reporting. |
| `frontend/src/mathpath/dashboard/parentMathPathDashboardEngine.js:268` | Weaknesses combine mastery, assessment, and mistakes. | Does not identify diagnostic improvement by skill. |

### Tutor Dashboard

| File | Current capability | Missing capability |
| --- | --- | --- |
| `frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx:715` | Loads latest diagnostic and working review. | Does not load diagnostic history. |
| `frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx:740` | Builds tutor dashboard from progress, diagnostic summary, practice, fluency, mistakes, working. | No before/after diagnostic evidence panel. |
| `frontend/src/mathpath/dashboard/tutorMathPathDashboardEngine.js` | Consumes weak skill IDs and readiness. | No explicit diagnostic attempt timeline. |

### Teacher Dashboard

| File | Current capability | Missing capability |
| --- | --- | --- |
| `frontend/src/pages/teacher/TeacherMathPathDashboardPage.jsx:352` | Checks whether each student has latest placement. | Does not load or compare diagnostic history. |
| `frontend/src/mathpath/dashboard/teacherMathPathDashboardEngine.js` | Builds synthetic/class readiness summaries. | No class-level diagnostic growth by before/after attempt. |

### Admin / Pilot Dashboard

| File | Current capability | Missing capability |
| --- | --- | --- |
| `routes/admin.js:515` | Pulls all Fractions diagnostic sessions for pilot students and sorts by update date. | Uses latest diagnostic for status; not yet a baseline/current growth report. |
| `services/mathpath/pilotFeedbackEngine.js:78` | Syncs outcome tracking for pilot summaries. | Outcome tracking is not diagnostic-history-native. |

# Risks

1. **Baseline ambiguity** - The first diagnostic exists as data, but nothing marks it as the permanent baseline for a domain.
2. **Latest-result bias** - APIs and dashboards frequently use the latest diagnostic only, which can hide the student’s starting point.
3. **Outcome tracking mismatch** - `OutcomeTracking` suggests before/after readiness, but the current engine derives readiness from assessment sessions, not diagnostic sessions.
4. **Legacy diagnostic submit path** - `routes/mastery.js` still has a batch submit endpoint that computes simple readiness and could diverge from the adaptive diagnostic result model.
5. **Domain coverage risk** - The registry is generic, but only Fractions is registered; diagnostics are not available for every topic/domain.
6. **Recheck UX is conditional** - Reassessment exists at the API/runtime level, but the student/adult workflow is not yet fully explicit.
7. **No intervention window model** - Practice/remediation exists, but the system does not yet formally group activity between baseline and after diagnostic.
8. **No skill-level diagnostic trend API** - Per-skill improvement must be reconstructed manually.
9. **No adult before/after panel** - Parent/tutor/teacher screens do not yet show baseline vs current diagnostic improvement.
10. **Test account reset can erase baseline** - Test reset intentionally deletes diagnostic state; acceptable for QA, but baseline preservation needs explicit production semantics.

# Missing Features

Top 10 missing items, priority order:

1. Top-level `diagnosticPurpose`, `attemptNumber`, `isBaseline`, and `baselineDiagnosticId` fields on diagnostic sessions.
2. Immutable baseline selection rule per `{ studentId, subjectId, domainId }`.
3. Diagnostic history API returning all completed attempts with scores/timestamps.
4. Diagnostic growth API returning baseline/current deltas by skill and overall readiness.
5. Per-skill diagnostic score snapshots stored at completion.
6. Intervention window model linking practice/remediation between diagnostic attempts.
7. Adult dashboard before/current/improvement panels.
8. Student-friendly progress-over-time view.
9. Registry expansion beyond Fractions.
10. Deprecation or unification of the legacy batch diagnostic submit route.

# Recommended Next Steps

## Pilot Readiness Verdict

**C. Significant gaps remain** for full before/intervention/after diagnostic measurement.

For a 5-student Fractions pilot focused on initial placement, practice, mistakes, working evidence, and latest progress, the diagnostic system is usable. For proving growth with a clean baseline and after-diagnostic report, it needs the implementation phases below.

## Phase 1 - Critical

Goal: Preserve baseline and expose diagnostic history without changing the student experience heavily.

Likely files:

- `models/mathpath/MathPathDiagnosticSession.js`
- `services/diagnostics/diagnosticRuntime.js`
- `routes/diagnostics.js`
- `routes/mastery.js`
- `frontend/src/services/api.js`
- New tests in `utils/diagnosticRuntime.test.js` or `routes/diagnostics.test.js`

Work:

1. Add top-level fields:
   - `diagnosticPurpose`
   - `attemptNumber`
   - `isBaseline`
   - `baselineDiagnosticId`
   - `previousDiagnosticId`
2. On first completed diagnostic per student/domain, mark it as baseline.
3. Ensure later diagnostics link back to the baseline.
4. Add `GET /api/diagnostics/history?subjectId=&domainId=&studentId=`.
5. Add tests proving baseline is not overwritten.

Complexity: **Medium**

Dependencies: existing session collection; replay policy; auth/student resolution.

## Phase 2 - Important

Goal: Produce actual Before -> After reporting.

Likely files:

- New service: `services/diagnostics/diagnosticGrowthService.js`
- `routes/diagnostics.js`
- `frontend/src/pages/student/mathpath/diagnostic/DiagnosticResultScreen.jsx`
- `frontend/src/pages/parent/ParentMathPathDashboardPage.jsx`
- `frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx`
- `frontend/src/pages/teacher/TeacherMathPathDashboardPage.jsx`
- `services/mathpath/outcomeTrackingEngine.js`

Work:

1. Store per-skill diagnostic snapshots at completion:
   - skillId
   - questionsAnswered
   - correct
   - score
   - confidenceScore
   - avgTimeTaken
   - workingSubmittedRate
   - misconceptionTags
2. Add `GET /api/diagnostics/growth`.
3. Return:
   - baseline
   - latest
   - overall readiness improvement
   - per-skill improvement
   - confidence calibration change
   - working evidence change
4. Update adult dashboards with compact growth panels.
5. Keep student UI encouraging and non-technical.

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

# Executive Summary

Audit target commits:

- `dee8a7a` - `Add MathPath diagnostic baseline history foundation`
- `f29af25` - `Add MathPath growth panels and paper analysis workflow`

Verdict: **partially implemented**.

The diagnostic baseline/history/growth foundation is materially implemented at the data and API layer. `MathPathDiagnosticSession` now stores baseline lineage, attempts, completion time, readiness score, and per-skill snapshots. Generic diagnostic history and growth APIs exist, and the adaptive diagnostic runtime applies completion metadata.

The paper-analysis workflow is an MVP foundation, not a complete AI school-paper analysis system. It supports adult upload, manual question confirmation, weak-skill recommendation records, and safe stub responses for assignment/recheck automation. OCR, automatic marking, remediation worksheet generation, parent report generation, and true practice/recheck creation are not implemented.

The adult dashboard growth cards are useful but shallow. They display baseline/current/change data, but "View Diagnostic History" routes back to existing dashboards rather than a dedicated history report, and "Run Recheck" is not a complete adult assignment flow.

# What Is Fully Implemented

- Diagnostic session schema fields exist in `models/mathpath/MathPathDiagnosticSession.js`:
  - `diagnosticPurpose` at line 14
  - `attemptNumber` at line 15
  - `isBaseline` at line 16
  - `baselineDiagnosticId` at line 17
  - `previousDiagnosticId` at line 18
  - `readinessScore` at line 28
  - `perSkillSnapshot` at line 29
  - `completedAt` at line 37

- Diagnostic lineage service functions exist in `services/diagnostics/diagnosticGrowthService.js`:
  - `buildPerSkillSnapshot` at line 39
  - `resolveDiagnosticLineage` at line 87
  - `applyDiagnosticCompletionMetadata` at line 116
  - `getDiagnosticHistory` at line 156
  - `buildDiagnosticGrowth` at line 205
  - `getDiagnosticGrowth` at line 249

- Adaptive diagnostic completion applies lineage and snapshot metadata in `services/diagnostics/diagnosticRuntime.js` via `applyDiagnosticCompletionMetadata`.

- Generic diagnostic routes exist in `routes/diagnostics.js`:
  - `GET /api/diagnostics/history` at line 32
  - `GET /api/diagnostics/growth` at line 52
  - `POST /api/diagnostics/start` at line 72
  - `POST /api/diagnostics/:sessionId/answer` at line 101

- Backward-compatible mastery diagnostic history/growth routes exist in `routes/mastery.js`.

- PaperAnalysis model exists in `models/mathpath/PaperAnalysis.js` with MVP enums and detected-question/recommended-action structures.

- Paper analysis API is registered in `server.js` at line 146 as `/api/mathpath/paper-analysis`.

- Paper analysis routes exist in `routes/mathpathPaperAnalysis.js`:
  - `POST /upload` at line 104
  - `GET /:id` at line 136
  - `PATCH /:id/review` at line 147
  - `POST /:id/assign-practice` at line 169
  - `POST /:id/create-recheck` at line 192

- Frontend API wrappers exist in `frontend/src/services/api.js`:
  - `diagnosticsAPI.history`
  - `diagnosticsAPI.growth`
  - `mathpathAPI.getDiagnosticHistory`
  - `mathpathAPI.getDiagnosticGrowth`
  - `mathpathAPI.uploadPaperAnalysis`
  - `mathpathAPI.paperAnalysis`
  - `mathpathAPI.reviewPaperAnalysis`
  - `mathpathAPI.assignPaperAnalysisPractice`
  - `mathpathAPI.createPaperAnalysisRecheck`

# What Is Partially Implemented

- Baseline immutability is implemented in service logic, but there is no database-level unique partial index preventing two baseline records for the same student/subject/domain under race conditions.

- Diagnostic history and growth are implemented from completed diagnostic sessions, but they do not model the intervention period explicitly. Tian OS can compare diagnostic snapshots, but it cannot yet produce a full "before -> intervention -> after" causal report.

- The legacy submit path in `routes/mastery.js` writes baseline-related fields directly. It does not use the same `applyDiagnosticCompletionMetadata` helper as the adaptive runtime, so there is duplicated lineage logic.

- `perSkillSnapshot` is stored, but the legacy submit path maps from `result.skillBreakdown`. If `skillBreakdown` is absent, the snapshot can be empty even when attempts exist.

- Adult growth cards are present through `frontend/src/components/mathpath/DiagnosticGrowthCard.jsx`, but action buttons are not complete workflows:
  - Parent/tutor "Run Recheck" navigates to `/student/mathpath/diagnostic`.
  - Teacher "Run Recheck" navigates to an assignment route with a query flag.
  - No dedicated diagnostic history page exists.

- Paper analysis upload and review exist, but detected questions are manual or keyword-based. OCR/AI extraction is explicitly not automatic in `frontend/src/pages/mathpath/PaperAnalysisPage.jsx`.

- Paper skill mapping exists in `services/mathpath/paperAnalysisSkillMapper.js`, but it is a small keyword/manual override mapper, not a curriculum-complete school-paper mapper.

- `assign-practice` and `create-recheck` endpoints are safe stubs returning `202`, not real automation.

# What Is Not Implemented

- OCR extraction for question text, student answers, teacher marks, ticks/crosses, or working evidence.

- Automatic AI marking of uploaded school papers.

- Automatic remediation worksheet generation from paper analysis.

- Automatic targeted practice assignment from paper analysis.

- Automatic mini diagnostic/recheck creation from paper analysis.

- Parent-facing paper analysis report generation.

- Dedicated student-care route `/student-care/students/:studentId/analyse-paper`.

- Full diagnostic history UI with attempt-by-attempt timeline.

- Trend graphs for diagnostic growth.

- Explicit intervention episode model linking practice/remediation/working evidence between diagnostics.

- Database-level baseline uniqueness enforcement.

# API Verification

| Endpoint | File | Status | Notes |
|---|---|---|---|
| `GET /api/diagnostics/history` | `routes/diagnostics.js` | Complete | Returns completed diagnostic sessions through `getDiagnosticHistory`. |
| `GET /api/diagnostics/growth` | `routes/diagnostics.js` | Complete for snapshot comparison, partial for product reporting | Computes baseline/latest/previous and growth deltas, but not intervention-linked reporting. |
| `POST /api/diagnostics/start` | `routes/diagnostics.js` | Complete | Accepts `diagnosticPurpose` and uses registry-backed adaptive runtime. |
| `POST /api/diagnostics/:sessionId/answer` | `routes/diagnostics.js` | Complete | Adaptive answer route persists attempts and applies completion metadata when complete. |
| `GET /api/mastery/diagnostic/history` | `routes/mastery.js` | Complete | Backward-compatible wrapper around growth service. |
| `GET /api/mastery/diagnostic/growth` | `routes/mastery.js` | Complete | Backward-compatible wrapper around growth service. |
| `POST /api/mastery/diagnostic/:sessionId/submit` | `routes/mastery.js` | Partial | Saves diagnostic results but duplicates lineage logic and can produce empty per-skill snapshots if `skillBreakdown` is missing. |
| `POST /api/mathpath/paper-analysis/upload` | `routes/mathpathPaperAnalysis.js` | Partial | Uploads one file and optionally accepts manual detected questions. No OCR. Malformed `detectedQuestions` JSON returns generic failure. |
| `GET /api/mathpath/paper-analysis/:id` | `routes/mathpathPaperAnalysis.js` | Complete | Loads a saved analysis with access checks. |
| `PATCH /api/mathpath/paper-analysis/:id/review` | `routes/mathpathPaperAnalysis.js` | Partial | Manual review works and recommendations are rebuilt. No rich review workflow or extraction correction model. |
| `POST /api/mathpath/paper-analysis/:id/assign-practice` | `routes/mathpathPaperAnalysis.js` | Stubbed | Returns `202`, `assigned: false`, and `assignment_service_pending`. |
| `POST /api/mathpath/paper-analysis/:id/create-recheck` | `routes/mathpathPaperAnalysis.js` | Stubbed | Returns `202`, `created: false`. |

# UI Verification

| UI | File/component | Status | Notes |
|---|---|---|---|
| Diagnostic growth card | `frontend/src/components/mathpath/DiagnosticGrowthCard.jsx` / `DiagnosticGrowthCard` | Partial | Displays baseline/current/change, top improved skill, remaining weak skill, and buttons. Buttons are not full adult workflows. |
| Parent MathPath dashboard card | `frontend/src/pages/parent/ParentMathPathDashboardPage.jsx` | Partial | Loads and displays diagnostic growth; recheck action routes to student diagnostic page. |
| Tutor MathPath dashboard card | `frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx` | Partial | Loads and displays growth; recheck action routes to student diagnostic page. |
| Teacher MathPath dashboard card | `frontend/src/pages/teacher/TeacherMathPathDashboardPage.jsx` | Partial | Aggregates class growth into one card; recheck action routes to assignment page query, not a complete recheck assignment flow. |
| Paper analysis page | `frontend/src/pages/mathpath/PaperAnalysisPage.jsx` / `PaperAnalysisPage` | Partial | Supports adult upload, upload type, raw Student ID entry, manual review rows, weak-skill summary, and action buttons. No OCR, no guided review table, no report. |
| Paper analysis routes | `frontend/src/App.jsx` | Partial | Parent, tutor, and teacher routes are registered. Student-care route is not implemented. |

# Data Model Verification

## MathPathDiagnosticSession

File: `models/mathpath/MathPathDiagnosticSession.js`

Status: **mostly complete for baseline/history/growth storage**.

Implemented:

- Diagnostic purpose and attempt fields.
- Baseline and previous diagnostic links.
- Completion timestamp.
- Readiness score.
- Per-skill snapshot.
- Chronological index on `studentId`, `subjectId`, `domainId`, `completedAt`.

Gaps:

- No database-level constraint guarantees only one baseline per student/subject/domain.
- `perSkillSnapshot` is `Mixed[]`; this is flexible but weakly validated.
- Historical intervention context is not part of the model.

## PaperAnalysis

File: `models/mathpath/PaperAnalysis.js`

Status: **complete MVP record shape, partial product readiness**.

Implemented:

- Upload type enum.
- Status enum.
- Uploaded-by fields.
- File URL/storage key fields.
- Detected question fields.
- Weak skills.
- Recommended actions.
- Linked diagnostic/practice placeholders.

Gaps:

- No parent report payload.
- No extraction confidence/source metadata stored per question beyond numeric `confidence`.
- No `needsAdultReview` stored even though the mapper returns it.
- No structured OCR/working crop fields.
- No remediation worksheet linkage.

# Before -> Intervention -> After Readiness

| Capability | Status | Evidence |
|---|---|---|
| 1. Baseline diagnostic | Complete | `MathPathDiagnosticSession` stores `isBaseline`/`baselineDiagnosticId`; `applyDiagnosticCompletionMetadata` marks first completed diagnostic. |
| 2. Practice/remediation intervention | Partial | Practice/remediation systems exist elsewhere, but these commits do not add an intervention episode linking practice between diagnostics. |
| 3. Recheck diagnostic | Partial | `diagnosticPurpose: recheck` is supported, but adult assign/run-recheck workflows are incomplete. |
| 4. Growth comparison | Complete at API level, partial as product report | `getDiagnosticGrowth` calculates readiness and per-skill improvement, but no full history page/trend graph/report exists. |
| 5. Adult-facing report | Partial | Adult cards show compact growth data. No detailed report or export exists. |

# Paper Analysis Readiness

| Capability | Status | Evidence |
|---|---|---|
| 1. Upload paper | Partial | `POST /api/mathpath/paper-analysis/upload` accepts PDF/JPG/PNG one-file upload. Multi-file page upload and OCR are not implemented. |
| 2. Review detected/wrong questions | Partial | Manual row review and `PATCH /review` exist. There is no rich correction UI for extracted data. |
| 3. Map to weak skills | Partial | Manual overrides and keyword mapping exist in `paperAnalysisSkillMapper.js`; mapping is limited. |
| 4. Assign targeted practice | Missing/stubbed | Endpoint returns `assigned: false`. |
| 5. Create recheck | Missing/stubbed | Endpoint returns `created: false`. |
| 6. Produce parent report | Missing | No report model, route, or UI. |

# Test Coverage

Tests added or changed in these commits:

- `routes/diagnostics.test.js`
- `utils/diagnosticGrowthLineage.test.js`
- `utils/diagnosticGrowthService.test.js`
- `utils/mathpathPaperAnalysisRoute.test.js`
- `utils/paperAnalysisModel.test.js`
- `utils/paperAnalysisSkillMapper.test.js`

Implementation validation reported before this audit:

- `npm test -- routes/diagnostics.test.js utils/diagnosticGrowthService.test.js utils/diagnosticRuntime.test.js utils/paperAnalysisModel.test.js utils/paperAnalysisSkillMapper.test.js utils/mathpathPaperAnalysisRoute.test.js`
- `npm --prefix frontend run build`

This documentation audit did not rerun tests.

Missing tests:

- End-to-end adult paper upload UI flow.
- Authorization matrix for parent, tutor, teacher, admin, and student rejection.
- Malformed `detectedQuestions` upload payload.
- Unsupported file upload handling at route level.
- Multiple-page/multiple-file paper upload expectations.
- Legacy `/api/mastery/diagnostic/:sessionId/submit` lineage parity.
- Baseline race condition or duplicate-baseline protection.
- Diagnostic growth card rendering/actions.
- PaperAnalysisPage upload/review UI.
- Real assign-practice integration.
- Real create-recheck integration.
- Parent report generation.

# Remaining Risks

- Baseline immutability depends on application logic, not a database uniqueness guarantee.

- The adaptive diagnostic and legacy diagnostic submit paths can diverge because lineage/snapshot logic is duplicated.

- Growth reporting may be misleading if users interpret it as causal improvement from interventions; it currently compares diagnostic snapshots only.

- Adult dashboard buttons can route adults into incomplete or role-inappropriate flows.

- Paper analysis may look more advanced than it is unless the MVP/manual limitation copy remains visible.

- Paper upload writes files to local disk under `uploads/mathpath-paper-analysis`, which may not be suitable for deployed infrastructure without a storage plan.

- Skill mapping is keyword-limited and may map incorrectly, especially given known Fractions F-code curriculum mapping risks.

- The `assign-practice` and `create-recheck` routes are intentionally stubbed, so the uploaded paper loop does not yet close into student work.

# Recommended Next Sprint

1. **Close the Paper Analysis Loop**
   - Rank: 1
   - Goal: make confirmed weak skills create real targeted practice assignments and real recheck diagnostics.
   - Likely files: `routes/mathpathPaperAnalysis.js`, `services/mathpath/paperAnalysisSkillMapper.js`, assignment/remediation services, `frontend/src/pages/mathpath/PaperAnalysisPage.jsx`, `frontend/src/services/api.js`.
   - Why first: this turns paper review from a saved note into an actionable learning loop.

2. **Harden Diagnostic Growth**
   - Rank: 2
   - Goal: add baseline uniqueness protection, remove lineage duplication in `routes/mastery.js`, and add a dedicated diagnostic history/report UI.
   - Likely files: `models/mathpath/MathPathDiagnosticSession.js`, `routes/mastery.js`, `services/diagnostics/diagnosticGrowthService.js`, adult dashboard pages, new history/report page.
   - Why second: the current foundation works, but it needs stronger integrity before scale.

3. **Upgrade Paper Extraction and Review UX**
   - Rank: 3
   - Goal: add OCR/extraction hooks, structured review table, extraction confidence states, and richer parent/tutor summaries.
   - Likely files: `models/mathpath/PaperAnalysis.js`, `routes/mathpathPaperAnalysis.js`, new extraction service, `frontend/src/pages/mathpath/PaperAnalysisPage.jsx`.
   - Why third: useful after the manual loop can already create assignments/rechecks.

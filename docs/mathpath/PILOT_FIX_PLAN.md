# Tian OS Pilot Fix Plan

Date: 2026-06-05

Source audit: `docs/mathpath/CURRENT_STATE_AUDIT.md`

Scope: practical pilot readiness for the current Tian OS student experience. This plan intentionally keeps the active `F001`-`F026` Fractions architecture in place for pilot. It does not build Paper Review, Learning Intelligence, WordPath production flows, new curriculum, or new question banks.

Pilot priority:

1. Student can complete diagnostic.
2. Student can answer practice questions reliably.
3. Working submission works.
4. Mistakes and progress update correctly.
5. Routes do not break.
6. No fake/demo/developer data appears to students.
7. Only stable features are visible.

## 1. Critical Pilot Blockers

| Priority | Blocker | Why It Blocks Pilot | Likely Files / Modules | Test Plan |
|---:|---|---|---|---|
| P0 | Student-facing flows fall back to `demo-student` | Risks fake/local state, wrong progress, wrong working linkage, and misleading pilot evidence. Found in MathPath home, practice, story, assessment, learning path, working upload review, and dashboard paths. | `frontend/src/pages/student/mathpath/MathPathHome.jsx`, `PracticeSession.jsx`, `FractionsStoryModeSession.jsx`, `FractionsLearningPathPage.jsx`, `working/WorkingUploadReviewScreen.jsx`, `assessment/AssessmentIntroScreen.jsx`, `frontend/src/pages/student/StudentDashboard.jsx`, `utils/studentContext.js` | Unit tests for no demo fallback; route smoke with authenticated student; verify local storage/progress keys use real student id; Playwright diagnostic -> practice -> mistakes flow. |
| P0 | Diagnostic completion must be reliable end-to-end | Pilot cannot start if placement fails, questions do not hydrate, answers do not submit, or results do not persist. | `frontend/src/pages/student/mathpath/diagnostic/*`, `routes/diagnostics.js`, `services/diagnostics/diagnosticRuntime.js`, `frontend/src/mathpath/fractions/fractionDiagnosticEngine.js`, `frontend/src/mathpath/fractions/fractionQuestionRepair.js` | Backend `routes/diagnostics.test.js`; frontend `DiagnosticQuestionScreen.test.jsx`; Playwright start diagnostic, answer all questions, land on results, refresh results route. |
| P0 | Practice answer submission and completion must persist attempts | Student learning loop fails if answers only update client state or completion does not update mastery/mistakes/telemetry. | `PracticeSession.jsx`, `fractionPracticeFlow.js`, `routes/practice.js`, `routes/mastery.js`, `models/PracticeAttempt.js`, `models/mathpath/MathPathAttempt.js`, `services/telemetry/learningTelemetryService.js` | Unit tests for answer validation and completion payload; backend practice completion test; Playwright recommended practice with correct and wrong answers; verify attempts created. |
| P0 | Working Evidence decision must be enforced without blocking valid mental work | Pilot requires answer + confidence + either working submitted or "I did not need working". It must work for mouse/touch/full-screen and not lose saved math objects. | `WorkingEvidenceDecision`, `WorkingCanvas`, `FullScreenWorkingMode`, `WorkingPreviewCard`, `PracticeSession.jsx`, `DiagnosticQuestionScreen.jsx`, `routes/mathpathWorking.js`, `MathPathWorkingSession`, `MathPathWorkingIntelligence` | Frontend tests for disabled submit until working decision; full-screen save/reopen preserves strokes/math objects; backend working upload/session tests; Playwright full-screen working save/delete preview. |
| P0 | Mistakes must be created and reviewable after wrong answers | Pilot feedback loop fails if mistakes do not appear or Mistake Review cannot find linked working. | `routes/mistakes.js`, `models/Mistake.js`, `PracticeSession.jsx`, `MistakesHome.jsx`, `MistakeReview.jsx`, `MistakeDetail.jsx`, `fractionMistakeToMasteryEngine.js`, `workingLinkageService.js` | Frontend MistakesHome/MistakeReview/MistakeDetail tests; backend mistakes route tests; Playwright wrong practice answer -> complete -> mistakes list -> mistake review. |
| P0 | Progress and dashboard must reflect real state, not abstract or stale state | Pilot students need to know what to do next. If dashboard/progress show stale local state or fake progress, the pilot becomes hard to interpret. | `StudentDashboard.jsx`, `Progress.jsx`, `MathPathHome.jsx`, `mathPathDomainProgressState.js`, `routes/mastery.js`, `routes/studentAnalytics.js`, `MasteryRecord`, `LearningTelemetryEvent` | Frontend dashboard/progress tests; backend mastery/analytics tests; Playwright diagnostic completion then dashboard reload verifies Today’s Mission/Progress changes. |
| P0 | Broken and unstable routes must be gated or removed from pilot navigation | Students should not hit incomplete routes, coming-soon dead ends, seed instructions, paper upload, or unstable assessment/marketplace flows. | `frontend/src/App.jsx`, `frontend/src/config/navigationConfig.js`, `frontend/src/config/modules.js`, `frontend/src/config/featureFlags.js`, `middleware/featureGate.js`, `frontend/src/pages/student/mathpath/StoryModeDomainRoute.jsx` | Route inventory test; Playwright navigation smoke over visible links only; assert hidden features are not reachable from student nav. |
| P0 | Developer-facing or seed copy must not appear to students | Found examples include `Run npm run seed:science`, `No questions seeded yet`, `Not seeded yet`, and possible coming-soon labels. Pilot must show student-friendly empty states only. | `ScienceTopics.jsx`, `MathPathHome.jsx`, `FluencySkills.jsx`, `StoryModeDomainRoute.jsx`, shared `EmptyState` usage | Text search regression; frontend tests for empty states; Playwright visible-text scan for `Run npm`, `seeded`, `demo-student`, `mock`, `placeholder`. |

## 1b. Evidence & Access Integrity Blockers (added 2026-06-09)

Source: `docs/tian-os-current-brief.md` §9/§10 + `docs/tian-os/CURRENT_PRACTICE_UX_AND_EVIDENCE_TRIAGE.md` (C1). These are not covered by §1 above and are evidence-trust / claim-safety blockers — they affect what data parents are shown, so they belong before any pilot that surfaces evidence to adults.

| Priority | Blocker | Why It Blocks Pilot | Likely Files / Modules | Test Plan |
|---:|---|---|---|---|
| P0 | 14 incorrect (and 21 questionable) fraction→skill mappings are still live (C1) | They generate live questions and therefore live evidence shown to adults. Same "misleading pilot evidence" risk as the demo-student fallback. Audit tooling exists but nothing is quarantined — there are zero quarantine markers in source today. | `frontend/src/mathpath/fractions/fractionQuestionFamilies.js`, `frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js`, source list in `docs/mathpath/FRACTIONS_QUESTION_SKILL_INTEGRITY_AUDIT.md`, `services/mathpath/fractionsRuntimeEvidenceIntegrityService.js` | Quarantined families are excluded from generation AND flagged by the runtime evidence integrity service; regenerate any pilot worksheets/recovery packs sourced from flagged families; `npm test`. |
| P1 | Per-mistake mastery and learning-path stage mastery can diverge | Parent-facing "mastered/understood" must be backed by real recheck evidence. The per-mistake badge is gated (corrected→understood→mastered) and reconciled by the integrity service, but the learning-path stage path is permissive. | `services/mathpath/fractionsRuntimeEvidenceIntegrityService.js` (~L634 `hasMasteryEvidence`), `services/mathpath/masteryCriteriaEngine.js` (`DEFAULT_MASTERY_CRITERIA` ~L53, `inferCompletedStagesFromProgress` ~L126) | Confirm `hasMasteryEvidence` requires a passing recheck/retention; set Fractions path `requiresMisconceptionResolved: true`; stop auto-inferring `mastery_check` from attempt count; test that mastery is unreachable without a passing recheck. |
| P1 | `StudentGuardian.accessLevel: 'view_only'` is assigned but not enforced | School-invited (view-only) parents could reach assign-practice / edit write routes. Default `full` keeps existing users safe, so not a regression, but the view-only promise is currently unenforced. | `routes/parentInvites.js` (assigns it), all guardian write routes, `services/billing/entitlements.js`, `models/StudentGuardian.js` | A `view_only` guardian is rejected by every guardian write route (test); keep `admin/school` + school-invite UI flag-gated until enforced. |

## 2. Major Bugs To Fix Before Pilot

| Priority | Bug / Risk | Likely Files / Modules | Test Plan |
|---:|---|---|---|
| P1 | Route test mismatch around diagnostic session route. App uses `/student/mathpath/diagnostic/session/:diagnosticSessionId`; some tests reference older route shape. | `frontend/src/App.jsx`, `DiagnosticQuestionScreen.test.jsx` | Align tests to real routes; route smoke for diagnostic intro/session/results. |
| P1 | Client-side `mathPathDomainProgressState` can drift from backend truth. | `mathPathDomainProgressState.js`, `StudentDashboard.jsx`, `MathPathHome.jsx`, `Progress.jsx`, `routes/mastery.js` | Refresh-after-completion test; verify backend mastery overrides stale local state. |
| P1 | Practice route supports generated local sessions and API sessions; completion paths may diverge. | `PracticeSession.jsx`, `fractionPracticeFlow.js`, `mathpathAPI.complete`, `routes/practice.js` | Test both `/practice/recommended-pathway` and API-created `/practice/:sessionId`; verify identical attempt/mistake/progress side effects. |
| P1 | Working upload can be started manually without session context. | `WorkingUploadScreen.jsx`, `WorkingUploadReviewScreen.jsx`, `AssessmentWorkingPromptScreen.jsx`, `PracticeSession.jsx` | Empty-context route test; ensure student-friendly return path and no orphan upload creation. |
| P1 | Unsupported Story Mode domains show coming-soon states. This is acceptable only if not linked in pilot navigation. | `StoryModeDomainRoute.jsx`, `MathPathHome.jsx`, `FractionsLearningPathPage.jsx`, feature flags | Navigation test verifies only supported fractions story links appear if Story Mode remains enabled; unsupported domains are not visible. |
| P1 | Fluency depends on seeded DB skills/questions; if empty, the UI must stay student-friendly. | `FluencyHome.jsx`, `FluencySkills.jsx`, `routes/fluency.js`, `routes/skills.js`, `FluencyRecord` | API empty inventory test; frontend empty-state test; Playwright `/student/mathpath/fluency` and `/fluency/skills`. |
| P1 | Parent/tutor dashboard routes can expose advanced summaries that are not pilot-essential. | `ParentMathPathDashboardPage.jsx`, `TutorMathPathDashboardPage.jsx`, `routes/parents.js`, `routes/tutor.js` | Smoke only for stable student-linked dashboard summaries; hide/disable advanced action links that route to unstable assessment upload/test-spec. |
| P1 | Error handling is inconsistent when backend is stale/rate-limited/unavailable. | API service layer, `MathPathHome.jsx`, `PracticeSession.jsx`, diagnostics pages, fluency pages | Simulated 401/403/429/500 tests; Playwright with backend restarted and QA rate limit disabled for local QA only. |

## 3. Non-Blocking Polish Issues

| Issue | Why It Can Wait | Likely Files |
|---|---|---|
| Micro-skill architecture is not live | Important for future precision, but switching before pilot would risk regressions. | `fractionsKnowledgeMapV1.js`, `fractionsDiagnosticAssetMapV1.js`, `fractionsRemediationAssetMapV1.js` |
| Story Mode can be improved further | Fractions Story Mode exists and can remain behind feature flag. It is not required for baseline pilot success. | `FractionsStoryModeSession.jsx`, `fractionStoryModeEngine.js` |
| Model Trainer polish | Useful intervention surface but not required for first pilot if normal practice/mistakes work. | `FractionsModelTrainer.jsx`, model trainer route |
| Parent/tutor advanced intelligence wording | Adult summaries exist. Pilot can run with simpler summaries while advanced insights mature. | parent/tutor dashboard engines |
| Science/Spelling non-MathPath polish | These are outside the MathPath pilot path unless shown in primary nav. | student science/spelling pages |
| Full design-system sweep | Current UI has been improved; pilot should prioritize reliability over full visual standardization. | student dashboards, MathPath pages |

## 4. Features To Disable For Pilot

Disable means hide from primary navigation and dashboard CTAs. Existing guarded routes may remain for internal QA if not visible to pilot students.

| Feature | Reason | Likely Files / Gates |
|---|---|---|
| Paper Review / assessment upload | Explicitly out of scope and architecture-only. Avoid fake analysis or unfinished upload promises. | `AssessmentUploadPage`, `/assessment-upload` routes in `App.jsx`, `featureGate.js`, parent/tutor/teacher dashboard links |
| Learning Intelligence UI or dashboard canonical use | Service exists but should not drive pilot decisions yet. | `services/learning/learningIntelligenceService.js`, dashboard engines |
| WordPath student-facing surfaces | Architecture exists, not production-ready. | `frontend/src/wordpath/`, future nav/links |
| Curriculum expansion / micro-skill-driven routing | Keep `F001`-`F026` production routing stable. | knowledge map assets, diagnostic/remediation asset maps |
| Assessment Blueprint/Test Specification for pilot students | Useful for adults/internal, but too broad for student pilot. | `/mathpath/test-spec`, `TestSpecificationPage`, assessment blueprint routes |
| Worksheet generator from student pilot path | Not part of diagnostic/practice/mistake loop. | worksheet routes/pages |
| Unsupported Story Mode domains | Fractions only if enabled; hide domain-level story links for unsupported domains. | `StoryModeDomainRoute.jsx`, feature flags |
| Developer/admin seeding controls | Must not be visible in student UI. | seed routes/buttons/copy |

## 5. Features To Postpone

| Feature | Postpone Until |
|---|---|
| Paper Review MVP | After live diagnostic/practice/working/mistakes/progress loop passes pilot QA. |
| Learning Intelligence as central dashboard engine | After shadow-mode comparison against current dashboard recommendations. |
| WordPath production diagnosis | After MathPath word-problem tagging is stable and not conflated with content weaknesses. |
| Micro-skill canonical migration | After adapters, dual-write, and dashboard parity are complete. |
| New question generation / curriculum expansion | After current inventory reliability and route stability are verified. |
| Full adult/tutor intervention marketplace logic | After parent/tutor dashboards show stable evidence from real student data. |
| Advanced OCR/AI marking | After working evidence and paper evidence models are stable. |

## 6. Exact Recommended Implementation Order

### Phase A: Pilot Surface Lockdown

Goal: students only see stable, tested features.

Tasks:

1. Define a `pilotStable` feature gate or equivalent config.
2. Hide Paper Review, assessment upload, test specification, WordPath, unsupported Story Mode domains, worksheet generator, and unstable adult-only routes from pilot navigation.
3. Replace developer-facing empty states with student-friendly copy.
4. Add a visible-route inventory test.

Likely files:

- `frontend/src/App.jsx`
- `frontend/src/config/navigationConfig.js`
- `frontend/src/config/modules.js`
- `frontend/src/config/featureFlags.js`
- `middleware/featureGate.js`
- `frontend/src/pages/student/mathpath/MathPathHome.jsx`
- `frontend/src/pages/student/science/ScienceTopics.jsx`
- `frontend/src/pages/student/mathpath/StoryModeDomainRoute.jsx`

Tests:

- frontend route/navigation tests
- text scan for forbidden copy
- Playwright visible navigation smoke

### Phase B: Remove Demo/Fake Student Fallbacks From Live Student Paths

Goal: all learning state belongs to the authenticated child Student record.

Tasks:

1. Replace `demo-student` fallback with resolved authenticated student id or safe blocked state.
2. Confirm dashboard/progress local storage keys use real student id only.
3. Confirm backend `resolveStudent` remains canonical for persisted records.
4. Add regression tests that fail if `demo-student` is used in production student paths.

Likely files:

- `MathPathHome.jsx`
- `PracticeSession.jsx`
- `FractionsStoryModeSession.jsx`
- `FractionsLearningPathPage.jsx`
- `WorkingUploadReviewScreen.jsx`
- `AssessmentIntroScreen.jsx`
- `StudentDashboard.jsx`
- `utils/studentContext.js`

Tests:

- frontend unit tests for each changed page
- Playwright login -> dashboard -> MathPath route verifies no demo key/copy
- backend student-context tests

### Phase C: Diagnostic Reliability Hardening

Goal: every pilot student can start, complete, and review diagnostic results.

Tasks:

1. Verify diagnostic intro creates a backend session consistently.
2. Verify diagnostic question hydration works on refresh.
3. Confirm answer submission requires answer, confidence, and working decision.
4. Confirm skip behaviour is intentional and recorded clearly.
5. Confirm results route works after direct refresh.
6. Align tests with actual App route paths.

Likely files:

- `DiagnosticIntroScreen.jsx`
- `DiagnosticQuestionScreen.jsx`
- `DiagnosticResultScreen.jsx`
- `routes/diagnostics.js`
- `services/diagnostics/diagnosticRuntime.js`
- `fractionDiagnosticEngine.js`
- `fractionQuestionRepair.js`

Tests:

- `routes/diagnostics.test.js`
- `DiagnosticQuestionScreen.test.jsx`
- add DiagnosticIntro/Result tests if missing
- Playwright diagnostic full completion

### Phase D: Practice Session Reliability Hardening

Goal: answer input, checking, session completion, and result navigation are stable.

Tasks:

1. Verify recommended practice route starts with a valid `F` skill and displayable questions.
2. Ensure no session can complete without persisted attempts.
3. Confirm generated/local and backend/API practice paths produce consistent result payloads.
4. Confirm answer renderers handle whole number, fraction, mixed number, MCQ, expression, and diagram questions.
5. Confirm display validation skips broken diagram questions safely and does not produce empty sessions.

Likely files:

- `PracticeSession.jsx`
- `AnswerInputRenderer.jsx`
- `FractionAnswerInput.jsx`
- `QuestionDiagram.jsx`
- `fractionPracticeFlow.js`
- `fractionQuestionGenerator.js`
- `fractionQuestionRepair.js`
- `routes/practice.js`
- `routes/mastery.js`
- `models/PracticeAttempt.js`
- `models/mathpath/MathPathAttempt.js`

Tests:

- `PracticeSession.test.jsx`
- `AnswerInputRenderer.test.jsx`
- backend practice/complete tests
- Playwright recommended practice with correct and wrong answers

### Phase E: Working Evidence Reliability Hardening

Goal: working evidence supports the pilot loop without blocking simple questions unnecessarily.

Tasks:

1. Verify `WorkingEvidenceDecision` appears consistently in diagnostic and practice.
2. Ensure submit/check buttons remain disabled until answer + confidence + working decision.
3. Verify full-screen working save/reopen preserves strokes and math objects.
4. Verify working upload creates session and intelligence records only with canonical student id.
5. Verify empty OCR/pending analysis states are student-friendly.

Likely files:

- `WorkingEvidenceDecision`
- `WorkingCanvas`
- `FullScreenWorkingMode`
- `WorkingPreviewCard`
- `PracticeSession.jsx`
- `DiagnosticQuestionScreen.jsx`
- `routes/mathpathWorking.js`
- `MathPathWorkingSession.js`
- `MathPathWorkingIntelligence.js`
- `workingIntelligenceService.js`
- `workingLinkageService.js`

Tests:

- working component tests
- `mathpath-working-evidence.spec.js`
- backend working route/service tests
- Playwright save/reopen/delete full-screen working

### Phase F: Mistake-To-Mastery And Progress Update Verification

Goal: wrong answers produce reviewable mistakes, and progress updates from real records.

Tasks:

1. Verify wrong practice answers create `Mistake` records with `attemptId`, `studentId`, `skillCode`, and working linkage when available.
2. Verify Mistakes Home shows no fake mistakes when empty.
3. Verify Mistake Review shows student answer, correct answer, explanation, working insight or pending state.
4. Verify recommended remediation can start a normal practice session.
5. Verify Progress page and Student Dashboard reflect updated mastered/working-on/needs-review state after session completion.

Likely files:

- `routes/mistakes.js`
- `models/Mistake.js`
- `MistakesHome.jsx`
- `MistakeReview.jsx`
- `MistakeDetail.jsx`
- `PracticeResult.jsx`
- `Progress.jsx`
- `StudentDashboard.jsx`
- `routes/mastery.js`
- `routes/studentAnalytics.js`
- `LearningTelemetryEvent.js`

Tests:

- `MistakesHome.test.jsx`
- `MistakeReview.test.jsx`
- add MistakeDetail test if missing
- mastery/progress backend tests
- Playwright wrong practice -> mistakes -> review -> remediation

### Phase G: Fluency Safe Mode

Goal: fluency is visible only if inventory is available and route behaviour is stable.

Tasks:

1. Verify `/api/skills?group=fluency` returns real available skills only.
2. If no skills exist, show student-friendly empty state.
3. Remove all seed/developer copy.
4. Confirm fluency start/complete works for available skill.
5. If inventory remains unreliable, hide Fluency from pilot primary CTA and keep it secondary.

Likely files:

- `FluencyHome.jsx`
- `FluencySkills.jsx`
- `routes/fluency.js`
- `routes/skills.js`
- `FluencyRecord.js`
- `fluencyCompletionService.js`

Tests:

- `FluencyHome.test.jsx`
- backend fluency route tests
- Playwright fluency page empty and available states

### Phase H: Route Regression And Pilot Smoke Gate

Goal: one command proves the pilot path works.

Tasks:

1. Add/maintain a Playwright pilot smoke spec covering visible stable routes.
2. Run backend targeted tests.
3. Run frontend targeted tests.
4. Run frontend build.
5. Run Playwright with local QA rate limiting disabled.

Pilot smoke routes:

- `/student`
- `/student/mathpath`
- `/student/mathpath/diagnostic`
- `/student/mathpath/diagnostic/session/:id`
- `/student/mathpath/diagnostic/results/:id`
- `/student/mathpath/practice/recommended-pathway`
- `/student/mathpath/results/:id`
- `/student/mathpath/mistakes`
- `/student/mathpath/mistakes/review`
- `/student/mathpath/fluency` if enabled

Tests:

- backend targeted MathPath tests
- frontend targeted MathPath tests
- `npm --prefix frontend run build`
- Playwright pilot smoke

## 7. Likely File / Module Ownership Map

| Area | Files / Modules |
|---|---|
| Pilot feature gating | `frontend/src/App.jsx`, `frontend/src/config/navigationConfig.js`, `frontend/src/config/modules.js`, `frontend/src/config/featureFlags.js`, `middleware/featureGate.js` |
| Student identity | `useAuth`, `utils/studentContext.js`, student MathPath pages with `demo-student` fallback |
| Diagnostic | `frontend/src/pages/student/mathpath/diagnostic/*`, `routes/diagnostics.js`, `services/diagnostics/*`, `fractionDiagnosticEngine.js` |
| Practice | `PracticeSession.jsx`, `PracticeResult.jsx`, `fractionPracticeFlow.js`, `fractionQuestionGenerator.js`, `routes/practice.js`, `routes/mastery.js` |
| Answer rendering | `AnswerInputRenderer.jsx`, `FractionAnswerInput.jsx`, `FractionExpressionQuestion.jsx`, `QuestionDiagram.jsx` |
| Working evidence | `WorkingEvidenceDecision`, `WorkingCanvas`, `FullScreenWorkingMode`, `WorkingPreviewCard`, `routes/mathpathWorking.js`, working services/models |
| Mistakes | `MistakesHome.jsx`, `MistakeReview.jsx`, `MistakeDetail.jsx`, `routes/mistakes.js`, `models/Mistake.js`, `fractionMistakeToMasteryEngine.js` |
| Progress/dashboard | `StudentDashboard.jsx`, `Progress.jsx`, `MathPathHome.jsx`, `routes/mastery.js`, `routes/studentAnalytics.js`, telemetry services |
| Fluency | `FluencyHome.jsx`, `FluencySkills.jsx`, `routes/fluency.js`, `routes/skills.js`, `FluencyRecord.js` |
| Route smoke | `frontend/src/App.jsx`, Playwright e2e specs |

## 8. Fix-by-Fix Test Plan

| Fix Area | Unit Tests | Backend Tests | E2E / Browser Tests | Acceptance Criteria |
|---|---|---|---|---|
| Feature gating | config/nav tests | feature gate tests | visible nav smoke | Pilot student sees only stable features. |
| Demo fallback removal | page tests for real user id | `studentContext` tests | login smoke, storage key check | No live path uses `demo-student`. |
| Diagnostic | diagnostic screen tests | diagnostics route/runtime tests | complete diagnostic | Student lands on result screen and result reloads. |
| Practice | PracticeSession/answer input tests | practice/mastery tests | complete recommended practice | Attempts persist and results route loads. |
| Working evidence | component tests | working route/service tests | full-screen working save/reopen | Student cannot continue without working decision; saved working remains attached. |
| Mistakes | MistakesHome/Review/Detail tests | mistakes route tests | wrong answer -> review | Mistake appears with explanation and safe working state. |
| Progress | dashboard/progress tests | mastery/analytics tests | complete session -> dashboard/progress | Progress reflects real backend state. |
| Fluency | FluencyHome/Skills tests | fluency route tests | fluency empty/available state | No developer copy; available skills start sessions. |
| Route regression | App route tests | auth/feature-gate tests | pilot smoke spec | No visible stable route crashes. |

## Recommended First Commit Scope

First implementation commit should include only:

1. pilot feature gating / route visibility
2. removal of `demo-student` fallbacks from live MathPath student paths
3. developer-facing empty-state copy cleanup
4. tests for those changes

Reason: these changes reduce pilot risk without touching diagnostic/practice engine behaviour.

After that, harden diagnostic and practice in separate focused commits so failures are easier to isolate.

## Explicit Non-Goals For This Pilot Fix Sprint

- Do not build Paper Review.
- Do not wire Learning Intelligence into production dashboards.
- Do not switch diagnostics or practice to micro-skills.
- Do not expand the question bank.
- Do not build new WordPath student flows.
- Do not introduce new OCR/AI marking.
- Do not redesign every screen.

The pilot should prove the current live learning loop is stable before the roadmap architecture becomes active.

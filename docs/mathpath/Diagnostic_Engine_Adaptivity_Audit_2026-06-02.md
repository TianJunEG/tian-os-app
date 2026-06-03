# MathPath Diagnostic Engine Adaptivity Audit - 2026-06-02

## Verdict

Current production diagnostic status: **partially metadata-driven placement, fixed batch diagnostic, Fractions-specific route**.

The current `/api/mastery/diagnostic/start` flow samples a fixed batch of Fractions questions before the student begins. The next question does not change after each response. Adaptation currently happens after submission through placement, readiness, mistakes, and recommendation logic.

The desired target is:

```text
Diagnostic Engine = generic decision machine
Skill Graph = subject/domain knowledge
Question Bank = item-level metadata
Student Model = evidence/history
Diagnostic Session = current adaptive state
```

This pass added a generic, pure decision engine foundation, but it is not yet wired into the diagnostic route.

## Audit Table

| File | Current behaviour | Hardcoded topic logic? | Uses skill metadata? | Uses prerequisite graph? | Uses confidence? | Uses timing? | Uses skip/no-answer? | Gap | Recommended fix | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `routes/mastery.js` diagnostic start | Starts a Fractions-only diagnostic, samples all questions up front, persists session. | Yes: `domainId: 'fractions'`, `loadFractionsSkills`, F-code mode ranges. | Partial: reads skill metadata for F-code mapping. | Not for next-question routing. | No at start. | No at start. | No at start. | Fixed batch, not adaptive. | Replace batch route with generic session start + next-question endpoint using generic selector. | Critical |
| `routes/mastery.js` diagnostic submit | Saves attempts, mistakes, placement result, readiness summary. | Yes: Fractions mistake classifier, Fractions starting skill resolver, `recommendedStartingTopic: 'Fractions'`. | Partial. | Post-hoc placement uses `Skill.prerequisiteSkillIds`. | Yes, stored and used for calibration summary. | Yes, stored and used in placement/timing analytics. | Yes, stored. | Adaptation happens after all questions, not per item. | Call generic decision engine after each response; persist decision history. | Critical |
| `utils/fractionPlacementResolver.js` | Chooses Fractions starting skill inside hardcoded F001-F026 ranges. | Yes. | No generic graph traversal; uses F-code numeric order. | Uses post-hoc prerequisite gaps passed in. | Indirect only. | No. | No. | Fractions-only recommendation resolver. | Replace in diagnostic route with graph metadata resolver; keep resolver as Fractions domain helper only. | High |
| `utils/placementEngine.js` | Generic-ish placement over Math skills by slug, accuracy, timing, retries, misconception tag. | Low: loads only Math subject in DB wrapper. | Yes: fluency target and remediation metadata. | Yes: `prerequisiteSkillIds`. | Estimates engine confidence, not student reflection directly. | Yes. | Not directly. | Good post-hoc scorer, not adaptive decision machine. | Keep as scoring/student model input; separate from next-question decisions. | Medium |
| `models/mathpath/MathPathDiagnosticSession.js` | Stores session id, domain, mode, target skills, result. | No topic logic in model. | N/A. | N/A. | Result only. | Result only. | Result only. | Missing adaptive state fields. | Added `currentSkillId`, `currentQuestionId`, `currentDecision`, `decisionHistory`, `assignedPracticeSkillIds`, `metadataGaps`, `adaptiveState`. | Done |
| `models/mathpath/MathPathAttempt.js` | Stores attempts with correctness, timing, confidence, help request, skip, working evidence. | No. | N/A. | N/A. | Yes. | Yes. | Yes. | Strong evidence model. | Reuse for diagnostic decisions and adult diagnosis. | Low |
| `models/Skill.js` | Stores skill graph and metadata bag. | No. | Yes, but field coverage varies by seed. | Yes, ObjectId prerequisites. | N/A. | N/A. | N/A. | Missing standardized diagnostic fields at schema level. | Standardize metadata: `subjectId/domainId/difficulty/diagnosticTags/commonErrorTags/masteryThreshold`. | High |
| `models/Question.js` | Stores bank items with skill, difficulty enum, category, family, worksheet, visual, misconception tag. | No. | Partial. | No direct `prerequisiteSkillIdsTested`. | N/A. | N/A. | N/A. | Missing diagnostic-purpose and adaptive selector metadata. | Add metadata fields or metadata bag: `diagnosticPurpose`, `errorTagsSupported`, `canRephrase`, `hasParallelItem`, `requiresWorking`, constraints. | High |
| `frontend/src/pages/student/mathpath/diagnostic/DiagnosticQuestionScreen.jsx` | Renders fixed question list, captures answer, reflection, help, time, skip, working. | Visible copy says Fractions Diagnostic. | Uses question payload, not graph metadata. | No. | Yes. | Yes. | Yes. | UI can capture evidence but does not ask backend for next adaptive item. | Add adaptive mode that submits one response and receives next decision/question. | High |
| `frontend/src/mathpath/fractions/fractionDiagnosticEngine.js` | Frontend Fractions diagnostic/session scoring utility. | Yes: F ranges, Fractions graph, F-code numeric order. | Yes for Fractions graph. | Yes for Fractions graph. | Yes. | Yes. | Yes. | Useful domain implementation, not generic. | Keep as Fractions domain data/scorer; do not use as generic engine. | Medium |
| `frontend/src/mathpath/orchestration/mathPathDomainOrchestrator.js` | Domain pipeline dispatches only Fractions engines. | Yes: `if (domainId !== 'fractions') return null`. | Domain-specific. | Domain-specific. | Partial. | Partial. | Partial. | Not domain-agnostic. | Convert to registry pattern where domains register engines/config. | Medium |

## Hardcoded Topic Logic Found

- `routes/mastery.js`
  - diagnostic sessions query and persist `domainId: 'fractions'`.
  - diagnostic start loads only `loadFractionsSkills()`.
  - diagnostic modes use hardcoded F-code ranges.
  - diagnostic result uses `recommendedStartingTopic: 'Fractions'`.
  - mistakes use `classifyFractionMistake`.
  - recommendation uses `resolveFractionsStartingSkill`.
- `utils/fractionPlacementResolver.js`
  - hardcoded `basic/core/full` F001-F026 ranges.
  - uses F-code numeric ordering.
- `frontend/src/mathpath/fractions/fractionDiagnosticEngine.js`
  - fixed Fractions skill graph/ranges and F-code numeric ordering.
- `frontend/src/mathpath/orchestration/mathPathDomainOrchestrator.js`
  - only supports `domainId === 'fractions'`.

These are acceptable as Fractions domain helpers, but not acceptable inside the future generic diagnostic engine.

## Metadata Gaps

### Skill Graph

Required for every diagnostic-capable skill:

- `skillId`
- `subjectId`
- `domainId`
- numeric `difficulty`
- `prerequisiteSkillIds`
- `diagnosticTags`
- `commonErrorTags`
- `masteryThreshold`
- diagnostic question availability count

Current status:

- DB `Skill` supports prerequisites and metadata, but does not enforce the above standard fields.
- Fractions frontend graph has difficulty and prerequisites, but it is frontend/domain-local.
- DB seeded MathPath skills use metadata F-code mapping, but coverage needs standardized validation.

### Question Bank

Required for adaptive diagnostics:

- `questionId`
- `skillId`
- numeric difficulty or normalized difficulty band
- `questionType`
- `diagnosticPurpose`
- `prerequisiteSkillIdsTested`
- `errorTagsSupported`
- `canRephrase`
- `hasParallelItem`
- `requiresWorking`
- generator constraints such as `countableContext` and `answerMustBeInteger`

Current status:

- `Question` has `skillId`, difficulty band, category, family, visual, worksheet flag, common mistakes, and misconception tag.
- It does not yet have first-class adaptive diagnostic fields.

### Diagnostic Persistence

Required:

- current skill/question
- response correctness
- confidence
- time taken
- skip/blank
- working submitted
- attempts
- rephrase used
- decision history
- detected error tags
- next decision
- assigned practice skills

Current status:

- `MathPathAttempt` stores most response evidence.
- `MathPathDiagnosticSession` now has optional adaptive fields for current decision, decision history, assigned practice, metadata gaps, and adaptive state.
- Existing routes do not yet populate those adaptive fields.

## Generic Engine Added

New file:

- `services/mathpath/diagnosticDecisionEngine.js`

Exports:

- `DIAGNOSTIC_DECISIONS`
- `decideNextDiagnosticStep(options)`
- `calculateDiagnosticReadinessScore(options)`

The engine is pure and consumes:

- `currentSkill`
- `currentQuestion`
- `response`
- `studentEvidence`
- `skillGraph`
- `sessionState`

It does not import Fractions code and does not contain hardcoded F-skill IDs.

Decision support:

- `MOVE_UP`
- `SAME_LEVEL_CONFIRMATION`
- `STEP_DOWN`
- `PREREQUISITE_PROBE`
- `MISCONCEPTION_PROBE`
- `REPHRASE_ONCE`
- `STOP_AND_ASSIGN_PRACTICE`
- `MARK_SECURE`
- `MARK_FRAGILE`
- `ASSIGN_REMEDIATION`

## Proposed Generic Architecture

### Phase 1 - Done In This Pass

- Audit current diagnostic architecture.
- Add pure generic decision engine.
- Add fake-domain tests.
- Add adaptive fields to diagnostic session model.

### Phase 2 - Generic Selector

Create:

- `services/mathpath/diagnosticQuestionSelector.js`

Responsibilities:

- select by `decision.nextSkillId`
- match `diagnosticPurpose`
- match `errorTagsSupported`
- respect `canRephrase`
- avoid repeated stems/families
- handle no-valid-question fallback

### Phase 3 - Route Integration

Create or refactor endpoints:

- `POST /api/mastery/diagnostic/start`
- `POST /api/mastery/diagnostic/:sessionId/respond`
- `GET /api/mastery/diagnostic/:sessionId/next`

The route should persist one decision per response and return the next question.

### Phase 4 - Domain Data Cleanup

Move all subject/domain knowledge into:

- skill graph data
- question metadata
- domain config
- generator validators

Fractions remains one domain plugged into the generic machine.

### Phase 5 - Data Quality Gate

Add a coverage/preflight script that fails when diagnostic-capable skills lack:

- prerequisites or explicit no-prerequisite marker
- difficulty
- diagnostic questions
- supported error tags
- answer validation metadata

## Remaining Risks

- Current student diagnostic remains a fixed batch until route integration is done.
- Fractions route still uses Fractions-specific placement and mistake classification.
- Question metadata is not rich enough for full adaptive selection yet.
- Skill metadata is not standardized across domains.
- Domain orchestrator is still Fractions-only.
- Adult dashboard diagnosis can consume evidence, but generic diagnostic decisions are not yet persisted by live sessions.


# MathPath Learning Enforcement Specification Freeze

Freeze date: 2026-06-09
Status: **Frozen for pilot** -- this document defines the learning enforcement architecture as implemented. Changes require a spec-change proposal.

Based on: `LEARNING_ENFORCEMENT_AUDIT.md` (2026-06-07) and `MISTAKE_LEARNING_ENFORCEMENT_AUDIT.md` (2026-06-07).

---

## 1. Architecture Overview

MathPath learning enforcement operates through four co-existing subsystems that together govern the path from mistake to mastery:

1. **Mistake-to-Mastery Pipeline** -- per-mistake learning status tracked on the `Mistake` model via `learningStatus`, enforced by `mistakeCorrectionFlow.js`.
2. **Shared Mastery Engine** -- per-skill mastery derived from answer accuracy and attempt volume via `masteryEngine.js`, writing `MasteryRecord`.
3. **Recovery Pack Teaching Flow** -- stage-gated remediation assignments via `recoveryPackTeachingFlowService.js` and `masteryCriteriaEngine.js`.
4. **Fraction Mistake-to-Mastery Engine** -- client-side mistake classification, intervention pathway generation, and mastery validation via `fractionMistakeToMasteryEngine.js`.

These subsystems share the `Mistake` model and `MasteryRecord` model but operate with partially independent resolution logic. The pilot accepts this co-existence with the known limitations documented in section 7.

---

## 2. Mistake-to-Mastery Pipeline

### 2.1 Pipeline Stages

The canonical learning status progression for each mistake is:

```
Detection -> Acknowledgment -> Correction -> Understanding -> Mastery
```

Implemented in `services/mathpath/mistakeCorrectionFlow.js` as the `learningStatus` enum:

| Stage | `learningStatus` | Student-facing copy | Gate |
|---|---|---|---|
| Detection | `new` | "Ready to learn from this mistake." | Mistake created by practice/diagnostic submission |
| Acknowledgment | `acknowledged` | "You found the mistake." | Student opens mistake detail; `reviewed` set to `true` |
| Correction | `corrected` | "You fixed the mistake." | Reflection >= 8 chars + correction attempt matches `correctAnswer` |
| Understanding | `understood` | "You showed understanding." | Prior correction required; understanding answer >= 8 chars |
| Mastery | `mastered` | "You can now solve similar questions successfully." | Evidence type in {`successful_correction`, `guided_question`, `independent_question`, `recheck`}; requires `understood` unless evidence is `recheck` |

### 2.2 Transition Rules

Defined in `applyMistakeLearningAction()` (`services/mathpath/mistakeCorrectionFlow.js:73-172`):

- **acknowledge**: `new` -> `acknowledged`. Sets `reviewed = true`, `status` from `open` to `reviewed`.
- **correct**: Requires reflection (>= 8 chars) and non-empty correction attempt. If correction matches stored `correctAnswer` (normalised, case-insensitive): `acknowledged` -> `corrected`. Otherwise remains `acknowledged`.
- **understand**: Requires prior `corrected` status or matching correction attempt. Understanding answer >= 8 chars -> `corrected` -> `understood`.
- **master**: Requires `masteryEvidence.evidenceType` in the approved set. Non-recheck mastery requires `understood`. Sets `resolved = true`, `status = 'resolved'`.

### 2.3 Normalisation and Matching

- `correctionMatches()` normalises both the expected and submitted answers: lowercase, whitespace-stripped, then checks exact match or substring inclusion.
- `hasUsefulReflection()` requires >= 8 trimmed characters.
- `understandingPassed()` requires >= 8 trimmed characters.

### 2.4 Mastery Evidence Types

Accepted `masteryEvidence.evidenceType` values:

| Type | Meaning |
|---|---|
| `successful_correction` | Student corrected this specific mistake |
| `guided_question` | Student answered a guided practice question correctly |
| `independent_question` | Student answered an independent question correctly |
| `recheck` | Student passed a recheck assessment (can bypass `understood` requirement) |

---

## 3. Mastery Progression Model

### 3.1 Shared Mastery Engine (Skill-Level)

File: `utils/masteryEngine.js`

The shared engine computes per-(student, skill) mastery from individual graded attempts using an exponential moving average.

**Thresholds:**

| Parameter | Value | Purpose |
|---|---|---|
| `MASTERED_AT` | 80 | Score threshold for mastered status |
| `REVIEW_BELOW` | 50 | Score below which status is `needs_review` |
| `MIN_ATTEMPTS_FOR_MASTERY` | 5 | Minimum attempts before mastery can be awarded |
| `DECAY_DAYS` | 60 | Days without practice before a mastered skill decays to `practising` |

**Score calculation:** Exponential moving average with alpha = 0.5 (< 3 attempts) or 0.3 (>= 3 attempts). Correct attempt = 100, wrong = 0.

**Status derivation** (`deriveStatus()`):
- 0 attempts -> `not_started`
- score >= 80 AND attempts >= 5 -> `mastered`
- score < 50 -> `needs_review`
- otherwise -> `learning`

**5-state mastery ladder** (`deriveMastery()`): `not_started` -> `developing` -> `practising` -> `fluent` -> `mastered`. Fluent/mastered distinction depends on `fluencyStatus === 'automatic'`. Decay applies after 60 days.

### 3.2 Confidence Calibration

File: `utils/masteryEngine.js:74-81`

Confidence in the mastery estimate is derived from two signals:

- **Evidence volume**: `min(1, attempts / 8)` -- saturates at 8 attempts.
- **Consistency**: `1 - (flips / (window_length - 1))` over a rolling window of the last 10 outcomes, where a flip is a correct/wrong transition.

Combined formula:
```
confidence = min(1, min(1, attempts / 8) * 0.6 + consistency * 0.4)
```

Rounded to two decimal places. Range: 0.00 to 1.00.

### 3.3 Fluency Tracking

Fluency is derived from the median response time of correct attempts (rolling window of 10) against a per-skill target (stored in `Skill.metadata.fluency.targetSeconds`):

- median <= target AND score >= 80 -> `automatic`
- median <= target * 1.8 -> `developing`
- otherwise -> `effortful`

### 3.4 Fraction Mistake-to-Mastery Validation

File: `frontend/src/mathpath/fractions/fractionMistakeToMasteryEngine.js` (`validateMistakeMastery()`)

Client-side mastery validation for mistake-level recovery:

| State | Criteria |
|---|---|
| `not_started` | No attempts |
| `emerging` | Any attempts |
| `developing` | accuracy >= 50% AND consistency >= 50% |
| `secure` | accuracy >= 75% AND last 3 all correct AND working evidence rate >= 50% |
| `mastered` | accuracy >= 85% AND last 3 all correct AND confidence aligned rate >= 60% |
| `retained` | `mastered` AND retention check passed |

### 3.5 Recovery Pack Mastery Criteria

File: `services/mathpath/masteryCriteriaEngine.js`

Default criteria for assignment-level recheck readiness:

| Criterion | Default | Description |
|---|---|---|
| `minAccuracy` | 75 | Minimum accuracy percentage |
| `minStageCompletion` | 1.0 | Fraction of required stages completed (100%) |
| `requiresMasteryCheck` | true | Must complete the mastery_check stage |
| `requiresMisconceptionResolved` | false | Misconception resolution not enforced (pilot) |
| `requiresConfidenceImproved` | false | Confidence improvement not enforced (pilot) |

Learning path stages (in order): concept_introduction -> visual_understanding -> worked_example -> guided_practice -> independent_practice -> mastery_check -> recheck_ready.

---

## 4. Confidence Calibration System

### 4.1 Per-Skill Confidence

Stored on `MasteryRecord.confidence`. Range 0.0-1.0. See section 3.2 for formula.

Interpretation:
- < 0.3: Very low evidence (few attempts or highly inconsistent)
- 0.3-0.6: Growing evidence
- 0.6-0.8: Moderate confidence
- 0.8-1.0: High confidence (consistent performance over many attempts)

### 4.2 Per-Mistake Classification Confidence

File: `frontend/src/mathpath/fractions/fractionMistakeToMasteryEngine.js` (`confidenceFromContext()`)

Base confidence for rule-inferred mistakes:
- Careless error (M010): base = 0.60
- All other codes: base = 0.82

Modifiers:
- Normalised student confidence multiplier (maps string labels to 0.55-1.0)
- Missing working flag: * 0.75
- Unreadable working flag: * 0.70
- Floor: 0.20, ceiling: 0.98

### 4.3 Per-Mistake Severity Calibration

Severity levels (from `MISTAKE_SEVERITY_LEVELS`):

| Level | Rank | Action Threshold |
|---|---|---|
| `minor` | 1 | Self-correction |
| `moderate` | 2 | Targeted practice |
| `major` | 3 | Reteach and practice |
| `critical` | 4 | Adult review required |

Escalation triggers (additive rank adjustments):
- Legacy severity = high: +1
- Same mistake code >= 3 times in history: +1
- Missing or unreadable working evidence: +1
- Response time > 120s: +0.5
- Careless error (M010) capped at rank 2 unless legacy severity is high

---

## 5. Enforcement Touch Points

### 5.1 Backend

| File | Role |
|---|---|
| `models/Mistake.js` | Mistake schema: `learningStatus` enum, `masteryEvidence`, `understandingCheck`, `correctionAttempt`, `reflection` fields |
| `models/MasteryRecord.js` | Per-(student, skill) mastery record: score, status, confidence, consistency, fluency, streaks |
| `models/mathpath/MathPathMistakeRecord.js` | Aggregate mistake frequency by code/skill/family |
| `models/mathpath/MathPathStudentSkillState.js` | Per-session skill state (accuracy-derived) |
| `models/mathpath/MathPathAssignment.js` | Recovery pack assignments with learning path stage tracking |
| `utils/masteryEngine.js` | Shared mastery engine: `recordAttempt()`, `weakSkills()`, `recommendNextSkill()`, confidence/fluency derivation |
| `services/mathpath/mistakeCorrectionFlow.js` | Mistake learning pipeline: status transitions, correction matching, mastery evidence validation, inflation risk audit |
| `services/mathpath/masteryCriteriaEngine.js` | Learning path stages, mastery criteria evaluation, stage completion tracking |
| `services/mathpath/recoveryPackTeachingFlowService.js` | Recovery pack teaching stages: worked example, visual, guided, independent, mastery check |
| `services/mathpath/recheckRecommendationService.js` | Recheck readiness evaluation (80% completion, 70% accuracy thresholds) |
| `services/mathpath/legacyMistakeEvidenceAuditService.js` | Admin audit for mistakes resolved without evidence |
| `routes/mastery.js` | Practice submission, skill state updates, diagnostic mistake creation |
| `routes/mistakes.js` | Mistake CRUD, review endpoint, bulk creation |
| `utils/remediationEngine.js` | Remediation plan generation (progressive disclosure steps) |

### 5.2 Frontend

| File | Role |
|---|---|
| `frontend/src/mathpath/fractions/fractionMistakeToMasteryEngine.js` | Mistake classification (13 codes M001-M013), intervention pathways, worksheet mappings, reassessment plans, mastery validation, retention scheduling |
| `frontend/src/mathpath/fractions/fractionSkillGraph.js` | Skill prerequisite graph for recommendation engine |
| `frontend/src/pages/student/mathpath/PracticeSession.jsx` | Practice flow: answer submission, confidence/reflection selection, working evidence |
| `frontend/src/pages/student/mathpath/PracticeResult.jsx` | Post-session: mistake list with optional Review Mistakes button |
| `frontend/src/pages/student/mathpath/MistakeDetail.jsx` | Per-mistake correction flow UI (reflection, correction, understanding, mastery) |
| `frontend/src/pages/student/mathpath/MistakesHome.jsx` | Mistake list and navigation |
| `frontend/src/pages/student/mathpath/MistakeReview.jsx` | Mistake review with Try Again / Try Together |
| `frontend/src/pages/student/mathpath/RecoveryPackTeachingFlow.jsx` | Stage-gated recovery pack UI |
| `frontend/src/components/mathpath/RemediationPanel.jsx` | Progressive-disclosure remediation steps |
| `frontend/src/pages/parent/MistakeCard.jsx` | Parent mistake visibility |
| `frontend/src/pages/parent/MistakeHistory.jsx` | Parent mistake history |
| `frontend/src/mathpath/state/mathPathDomainProgressState.js` | Domain-level progress aggregation |

---

## 6. Frozen Pilot Specification

The following behaviours are declared as the frozen spec for the MathPath fractions pilot:

### 6.1 What IS enforced

1. **Mistake creation**: Every wrong practice or diagnostic answer creates a `Mistake` record with `learningStatus: 'new'`.
2. **Mistake correction flow**: The `MistakeDetail` page enforces the full pipeline: acknowledge -> correct (with reflection + correction match) -> understand (8+ char answer) -> master (with approved evidence type).
3. **Recovery Pack stage gating**: Teaching flow stages must be completed in order; recheck readiness requires mastery criteria to be met.
4. **Shared mastery thresholds**: Score >= 80 AND attempts >= 5 for skill-level mastery.
5. **Confidence derivation**: Evidence volume (attempts/8) + consistency (rolling outcome window) produce a 0-1 confidence score.
6. **Fluency tracking**: Median response time vs per-skill target produces automatic/developing/effortful status.
7. **Mastery decay**: Skills unpractised for 60+ days decay from mastered/fluent to practising.
8. **Mistake taxonomy**: 13 fraction mistake codes (M001-M013) with rule-based inference, severity calibration, and intervention pathway mapping.
9. **Working evidence signals**: Missing/unreadable working flags reduce classification confidence.

### 6.2 What is NOT enforced (accepted for pilot)

1. **Post-mistake continuation gate**: Students can press "Next question" or "Continue MathPath" after a wrong answer without entering the correction flow.
2. **Mistake-level resolution independence**: `masteryEngine.js` auto-resolves open mistakes when skill-level mastery is reached, without checking per-mistake `learningStatus` or `masteryEvidence`.
3. **MistakeReview bypass**: "Try Again" from MistakeReview can launch practice without requiring the MistakeDetail correction flow.
4. **RemediationPanel persistence**: Progressive-disclosure steps are not persisted as durable learning evidence.
5. **Recovery Pack fallback answers**: When no `expectedAnswer` exists for a fallback question, any non-empty answer is accepted as correct.
6. **Working-quality mastery gating**: Working quality band does not gate mastery award or recheck readiness.

---

## 7. Known Limitations and Future Work

### 7.1 High-Priority (Post-Pilot Sprint B)

1. **Stop auto-resolving mistakes from shared skill mastery alone**
   - File: `utils/masteryEngine.js:99-105`
   - The `Mistake.updateMany(... status: 'resolved')` call should check `learningStatus` and `masteryEvidence` before resolution.

2. **Make skill mastery evidence-aware**
   - Files: `utils/masteryEngine.js`, `routes/mastery.js`, `services/mathpath/masteryCriteriaEngine.js`
   - Require at least one of: independent follow-up success, mastery check, recheck, or verified correction + later independent success.

3. **Route MistakeReview "Try Again" through enforced correction flow**
   - Files: `frontend/src/pages/student/mathpath/MistakeReview.jsx`, `MistakeDetail.jsx`
   - Avoid direct similar-practice bypass of correction.

4. **Tighten Recovery Pack fallback mastery checks**
   - Files: `services/mathpath/recoveryPackTeachingFlowService.js`, `RecoveryPackTeachingFlow.jsx`
   - Fallback questions without expected answers should not satisfy mastery check.

### 7.2 Medium-Priority (v0.2)

1. Persist RemediationPanel engagement as learning evidence.
2. Add parent/tutor risk cards for: reviewed-without-evidence, auto-resolved mistakes, missing working, recheck pending.
3. Make working quality influence mastery confidence (missing working should lower confidence for high-working skills).
4. Link similar-practice success back to the original mistake as explicit `masteryEvidence`.
5. Add telemetry: `mistake_detail_viewed`, `mistake_explanation_viewed`, `remediation_step_viewed`, `remediation_panel_opened`, `try_again_started`, `mistake_review_skipped`.

### 7.3 Future Enhancements

1. Adaptive "must correct before next session" policies for high-confidence wrong answers.
2. Misconception-specific recheck selection and scoring.
3. Adult override with evidence requirements.
4. Longitudinal learning-chain analytics (mistake created -> reflection -> correction -> guided -> independent -> recheck).
5. Automated QA that attempts bypass and fails if mastery is awarded too early.
6. AI-read student explanations to classify conceptual/procedural/careless/misread.
7. Working comparison (old vs new) for mistake correction evidence.

---

## 8. Mistake Taxonomy Reference (Frozen)

13 fraction mistake codes implemented in `fractionMistakeToMasteryEngine.js`:

| Code | Title | Category | Severity Profile |
|---|---|---|---|
| M001 | Whole-Number Thinking | conceptual_misconception | major |
| M002 | Numerator-Only Comparison | conceptual_misconception | major |
| M003 | Denominator Confusion | conceptual_misconception | critical |
| M004 | Equivalent Fraction Weakness | knowledge_gap | major |
| M005 | Simplification Error | procedure_error | moderate |
| M006 | Mixed Number Conversion Error | procedure_error | major |
| M007 | Common Denominator Error | procedure_error | major |
| M008 | Operation Selection Error | question_misread | major |
| M009 | Multiplication/Division Procedure Error | procedure_error | major |
| M010 | Careless Arithmetic Error | careless_error | minor |
| M011 | Fraction-Decimal-Percentage Conversion Error | knowledge_gap | major |
| M012 | Ratio with Fraction/Decimal Error | exam_technique_error | major |
| M013 | Algebraic Fraction Notation Misread | question_misread | major |

---

## 9. Audit Functions (Frozen)

Two audit functions ship with the pilot:

1. `auditMasteryInflationRisk()` (`services/mathpath/mistakeCorrectionFlow.js:187-203`): Flags mistakes that are reviewed-without-evidence or resolved-without-evidence. Returns risk level: low/medium/high.

2. `legacyMistakeEvidenceAuditService.js`: Admin-facing audit for mistakes resolved without matching mastery evidence chain.

These audits are monitoring-only for the pilot and do not block student progression.

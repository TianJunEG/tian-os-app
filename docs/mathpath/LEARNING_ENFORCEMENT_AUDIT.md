# Learning Enforcement Audit

Audit date: 2026-06-07

Scope: Tian OS MathPath student learning loop, including practice, mistakes, remediation, recheck, mastery, working evidence, and adult visibility.

Audit type: documentation-only. No production logic, tests, data, or routes were modified.

## 1. Executive Summary

Learning Enforcement Score: 54 / 100

Tian OS now has several strong enforcement primitives: `Mistake.learningStatus`, `mistakeCorrectionFlow`, Recovery Pack teaching stages, assignment progress, recheck readiness checks, working evidence linkage, and admin legacy mistake audit services. These are the right building blocks for the target loop:

Wrong -> Mistake Identified -> Reflection -> Guided Correction -> Recovery Practice -> Recheck -> Corrected -> Mastered

However, the platform does not yet enforce that loop consistently across all student paths.

The main answer to the core audit question is: yes, a student can still answer incorrectly, skip the enforced mistake-detail learning flow, continue practising, and eventually receive skill mastery through accuracy-based practice pathways without proving understanding of the earlier mistake.

The highest-risk path is:

1. Student answers a practice question incorrectly.
2. Backend creates a `Mistake` and updates mastery/progress independently.
3. Student sees feedback and can press `Next question` or `Finish Session`.
4. Student can ignore MistakeDetail, remediation, and Recovery Pack teaching flow.
5. Later correct attempts can raise `MasteryRecord.status` to `mastered`.
6. `utils/masteryEngine.js` then resolves open mistakes for that skill with `status: resolved`, without requiring per-mistake correction, understanding, or mastery evidence.

Current state:

- MistakeDetail has real gates for reflection, correction, understanding, and mistake-level mastery evidence.
- MistakeReview and MistakesHome still allow direct "Try Again" / similar practice without forcing MistakeDetail gates.
- Generic practice and legacy shared mastery can still award skill mastery from attempts alone.
- New Recovery Pack Teaching Flow is stage-based, but fallback questions can be accepted with any non-empty answer when no expected answer exists.
- Working evidence is meaningful for insight generation and adult review, but it does not consistently gate mastery or recheck readiness.
- Parent/tutor visibility has improved, but adults still mostly see states and summaries rather than a clear "skipped remediation / unresolved learning chain" workflow.

## 2. Current Learning Flow

### Practice Flow

Relevant files:

- `frontend/src/pages/student/mathpath/PracticeSession.jsx`
- `frontend/src/pages/student/mathpath/PracticeResult.jsx`
- `routes/practice.js`
- `routes/mastery.js`
- `models/PracticeAttempt.js`
- `models/mathpath/MathPathAttempt.js`
- `models/Mistake.js`

There are two practice paths:

1. Legacy/general practice path:
   - `routes/practice.js`
   - `PracticeAttempt`
   - `MasteryRecord`
   - shared `Mistake`

2. Fractions MathPath practice path:
   - `routes/mastery.js` under `/fractions/practice`
   - `MathPathAttempt`
   - `MathPathPracticeSession`
   - `MathPathStudentSkillState`
   - shared `Mistake`
   - `MathPathMistakeRecord`

Actual flow after a wrong answer:

```text
Student submits answer
-> answer is checked
-> immediate feedback/explanation is shown
-> attempt is persisted
-> mistake record is created if wrong
-> progress/mastery state is updated
-> student can continue to next question/session result
```

In `PracticeSession.jsx`, after feedback exists, the primary button becomes `Next question` or the session finish label. There is no required redirect to MistakeDetail, reflection, correction, or Recovery Pack before continuing.

In `PracticeResult.jsx`, mistakes are listed and a `Review mistakes` button appears, but it is optional. The student can also use `View progress` or `Continue MathPath`.

### Practice Enforcement Finding

Practice requires answer submission, confidence/reflection selection, and working evidence decision before checking an answer. It does not require post-mistake learning before continuing.

This means explanations are currently instructional feedback, not enforcement.

## 3. Status Mapping

### Shared Mistake Statuses

File: `models/Mistake.js`

Current status fields:

| Field | Values | Actual Meaning |
|---|---|---|
| `status` | `open`, `reviewed`, `resolved` | Legacy review/resolution state. Still used by mistake lists and mastery resolution. |
| `reviewed` | boolean | Backward-compatible flag. Means the student/adult acknowledged or opened review, not necessarily learned. |
| `resolved` | boolean | Legacy resolved flag. Can be set by mistake-learning mastery or by shared mastery engine. |
| `learningStatus` | `new`, `acknowledged`, `corrected`, `understood`, `mastered` | New learning-evidence state. Best current representation of actual learning progression. |
| `reflection` | string | Student explanation/reflection evidence. |
| `correctionAttempt` | string | Student correction evidence. |
| `understandingCheck` | object | Lightweight understanding evidence. |
| `masteryEvidence` | object | Explicit mistake-level mastery evidence. |

### Mistake Learning Transitions

File: `services/mathpath/mistakeCorrectionFlow.js`

Current enforced transitions:

```text
new
-> acknowledged
-> corrected
-> understood
-> mastered
```

Observed rules:

- `acknowledge`: sets `reviewed = true`; if `status` is `open`, moves to `reviewed`.
- `correct`: requires a reflection of at least 8 characters and a correction attempt. It marks `corrected` only if the correction matches the stored correct answer.
- `understand`: requires corrected status or a matching correction attempt; understanding passes if the answer has at least 8 characters.
- `master`: requires `masteryEvidence.evidenceType` in `successful_correction`, `guided_question`, `independent_question`, or `recheck`. Non-recheck mastery requires prior `understood`.

This is a real enforcement model at the MistakeDetail level.

### Ambiguous / Risky Status Meaning

`status: reviewed` and `reviewed: true` still exist and are still exposed. They do not prove learning. The code correctly documents this in places, but several adult/student surfaces still treat "reviewed" as a meaningful progress state without necessarily showing the missing evidence chain.

## 4. Mastery Audit

### Pathway A: Shared MasteryRecord Path

Files:

- `routes/practice.js`
- `utils/masteryEngine.js`
- `models/MasteryRecord.js`
- `routes/mastery.js` top-level `/api/mastery`

Trigger:

`routes/practice.js` calls `recordAttempt()` after every submitted attempt.

Mastery rule:

`utils/masteryEngine.js` updates `MasteryRecord` using an exponential moving score. A skill becomes `mastered` when:

- score >= 80
- attempts >= 5

Dangerous behaviour:

When `rec.status === 'mastered'`, `recordAttempt()` runs:

```js
Mistake.updateMany(
  { studentId, skillId, status: { $ne: 'resolved' } },
  { $set: { status: 'resolved' } }
)
```

This resolves open mistakes for the skill without checking:

- `learningStatus`
- `reflection`
- `correctionAttempt`
- `understandingCheck`
- `masteryEvidence`
- Recovery Pack completion
- recheck completion

Verdict: dangerous pathway.

It can over-resolve mistakes based on later aggregate skill accuracy, even if the original mistake was never corrected or understood.

### Pathway B: Fractions MathPathStudentSkillState Path

Files:

- `routes/mastery.js`
- `models/mathpath/MathPathStudentSkillState.js`
- `frontend/src/mathpath/state/mathPathDomainProgressState.js`

Trigger:

`routes/mastery.js` `/fractions/practice/:practiceSessionId/submit` computes per-skill accuracy in a session and writes:

```text
accuracy >= 90 -> status: mastered
accuracy >= 60 -> status: learning
else -> needsReview
```

Dangerous behaviour:

The state can mark a skill `mastered` after session-level accuracy without checking unresolved mistake evidence or recheck evidence.

This path does not appear to automatically resolve shared `Mistake` records, but it can still feed dashboard/progress mastery claims.

Verdict: questionable pathway.

### Pathway C: Recovery Pack Teaching Flow

Files:

- `models/mathpath/MathPathAssignment.js`
- `services/mathpath/recoveryPackTeachingFlowService.js`
- `services/mathpath/recheckRecommendationService.js`
- `frontend/src/pages/student/mathpath/RecoveryPackTeachingFlow.jsx`

Current rule:

Recovery Pack recheck readiness requires:

- worked example viewed
- visual explanation viewed
- guided practice completed
- independent practice completed
- mastery check passed

This is stronger and closer to the target learning loop.

Risk:

If referenced question records are missing, `recoveryPackTeachingFlowService.js` creates fallback questions. In `RecoveryPackTeachingFlow.jsx`, if a question has no expected answer, `answerIsCorrect()` returns true for any non-empty answer.

This means fallback mastery checks may be too weak.

Verdict: valid concept, partial enforcement.

### Pathway D: MistakeDetail Mastery

Files:

- `routes/mistakes.js`
- `services/mathpath/mistakeCorrectionFlow.js`
- `frontend/src/pages/student/mathpath/MistakeDetail.jsx`

Current rule:

Mistake-level mastery is gated by:

- correction
- understanding
- mastery evidence

Verdict: valid mistake-level pathway.

Remaining problem:

It is not mandatory before the student continues practising or before skill-level mastery may be awarded elsewhere.

## 5. Gap Analysis

Target:

```text
Wrong
-> Reflection
-> Guided Correction
-> Recovery
-> Recheck
-> Corrected
-> Mastered
```

Current implementation:

```text
Wrong
-> Mistake record created
-> Explanation shown
-> Student can continue
-> Optional mistake review
-> Optional remediation panel
-> Optional Recovery Pack
-> Optional recheck
-> Mastery can still be reached by later attempts
```

### Missing or Weak Steps

| Target Step | Current Status | Gap |
|---|---|---|
| Mistake identified | Mostly implemented | Shared `Mistake` and `MathPathMistakeRecord` are created, but mappings may be sparse. |
| Reflection | Implemented only in MistakeDetail | Not required after wrong practice answer. |
| Guided correction | Implemented only in MistakeDetail / Recovery Pack | MistakeReview can show passive explanation and launch practice directly. |
| Recovery practice | Implemented via Recovery Pack and similar practice | Recovery Pack is not always mandatory; similar practice can bypass teaching stages. |
| Recheck | Implemented for assignments | Not required for shared skill mastery. |
| Corrected | Implemented at mistake level | Not linked consistently to skill mastery/progress. |
| Mastered | Implemented in multiple places | Mastery can be awarded without mistake-level evidence or recheck evidence. |

### Bypass Paths

1. Practice bypass:
   - Wrong answer -> feedback shown -> `Next question`.
   - No reflection/correction required.

2. Result bypass:
   - Session complete -> mistakes shown -> student can choose progress/home instead of review.

3. MistakeReview bypass:
   - Student can read answer/explanation, open Try Together, or start `Try Again`.
   - No required reflection or correction gate.

4. Mastery bypass:
   - Later correct attempts can trigger `MasteryRecord.status = mastered`.
   - `recordAttempt()` resolves open mistakes for the skill without per-mistake evidence.

5. Recovery Pack fallback bypass:
   - Missing question records create fallback questions.
   - Fallback questions without expected answers can pass on any non-empty response.

## 6. Remediation Engine Audit

Relevant files:

- `frontend/src/components/mathpath/RemediationPanel.jsx`
- `utils/remediationEngine.js`
- `services/mathpath/misconceptionInterventionMap.js`
- `services/mathpath/recoveryPackAssetService.js`
- `services/mathpath/recoveryPackTeachingFlowService.js`

Current behaviour:

- `RemediationPanel` loads a plan and reveals steps one at a time.
- The panel is passive unless the student chooses to reveal the next step.
- Completion of remediation-panel steps is not persisted as learning evidence.
- Recovery Pack Teaching Flow persists stage progress, but only when the student is inside that specific route.

Verdict:

Remediation exists in two modes:

1. Passive help panel: not enforced, no durable proof of engagement.
2. Recovery Pack teaching flow: stronger and persistent, but not mandatory after every mistake and has fallback-answer risks.

## 7. Recheck System Audit

Relevant files:

- `services/mathpath/recheckRecommendationService.js`
- `services/mathpath/mathPathAssignmentService.js`
- `routes/mathpathAssignments.js`
- `services/diagnostics/diagnosticRuntime.js`
- `services/mathpath/studentRecheckSummaryService.js`

Current behaviour:

- Assignments can recommend recheck when completed or sufficiently complete with adequate accuracy.
- If an assignment has a learning path, `evaluateRecheckReadiness()` checks mastery criteria.
- Rechecks can be created from assignments with `diagnosticPurpose = recheck`.
- Recheck summaries can explain improvement to students.

Strength:

The assignment/recheck path is coherent and can support Before -> Intervention -> After.

Weakness:

Recheck is not a universal gate for skill mastery. The shared mastery engine and MathPath skill-state path can still mark mastery without a recheck.

## 8. Working Evidence Integration

Relevant files:

- `frontend/src/components/learning/WorkingCanvas.jsx`
- `frontend/src/components/learning/FullScreenWorkingMode.jsx`
- `frontend/src/components/learning/WorkingEvidenceDecision.jsx`
- `routes/mathpathWorking.js`
- `models/mathpath/MathPathWorkingSession.js`
- `models/mathpath/MathPathWorkingIntelligence.js`
- `services/mathpath/workingInsightPipeline.js`
- `services/mathpath/workingLinkageService.js`
- `frontend/src/components/mathpath/working/AdultWorkingReviewPanel.jsx`

Current behaviour:

- Practice can require a working decision before answer submission.
- Attempts store working states: submitted, on paper, not needed, uploaded, session IDs, images, strokes.
- Working intelligence can detect method, issue, quality band, misconception tags, and adult insights.
- Working can link to mistakes and be shown in MistakeDetail/MistakeReview.
- Working evidence can influence remediation copy through `utils/remediationEngine.js`.

Educational meaning:

Working evidence is meaningful as diagnostic and explanation evidence. It is more than a file store.

Current enforcement gap:

Working evidence does not consistently affect:

- whether a student can receive skill mastery
- whether recheck readiness is valid
- whether a mistake can be resolved
- whether missing working should downgrade confidence in mastery

The system records working quality, but mastery engines do not yet require or discount based on working quality.

## 9. Parent Visibility Audit

Relevant files:

- `frontend/src/pages/parent/MistakeCard.jsx`
- `frontend/src/pages/parent/MistakeHistory.jsx`
- `frontend/src/pages/parent/ParentMathPathDashboardPage.jsx`
- `frontend/src/pages/parent/ParentSuccessCentre.jsx`
- `frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx`
- `frontend/src/pages/tutor/TutorStudentProfile.jsx`
- `frontend/src/pages/tutor/LessonPrep.jsx`
- `routes/admin.js`
- `services/mathpath/legacyMistakeEvidenceAuditService.js`

### What Adults Can See

Adults can see:

- recent mistakes
- weak skill clusters
- mistake learning statuses (`new`, `acknowledged`, `corrected`, `understood`, `mastered`)
- Recovery Pack status
- recheck-ready assignments
- working summaries and insights
- tutor lesson prep evidence
- admin mistake-learning audit rows

### Visibility Gaps

Adults cannot yet reliably see:

- "student skipped explanation"
- "student viewed remediation but did not complete correction"
- "student practised similar questions without correcting original mistake"
- "skill is marked mastered but unresolved mistake evidence exists"
- "working missing, therefore mastery confidence is limited"
- "Recovery Pack fallback questions were used"
- "mistake was auto-resolved by aggregate mastery"

Admin has a `mistake-learning-audit` and `legacy-mistake-evidence-audit`, but this is not yet presented as a normal parent/tutor learning-risk signal.

## 10. Risk Assessment

### Students Can Skip Learning

Rating: High

Evidence:

- Practice feedback allows direct `Next question`.
- Practice result allows continuing without reviewing mistakes.
- MistakeReview can launch similar practice without enforcing MistakeDetail correction.
- RemediationPanel is optional and progressive disclosure is not persisted as evidence.

### Mastery May Be Overcounted

Rating: High

Evidence:

- `utils/masteryEngine.js` marks `MasteryRecord.status = mastered` from score and attempt count.
- The same function resolves all open mistakes for that skill without checking `masteryEvidence`.
- `routes/mastery.js` can set `MathPathStudentSkillState.status = mastered` from one session's >=90% accuracy.
- Recovery Pack fallback questions can pass on non-empty answers if no expected answer exists.

### Parent Visibility Is Insufficient

Rating: Medium

Evidence:

- Parent/tutor surfaces now show mistake learning statuses and Recovery Pack states.
- But they do not clearly show bypasses, skipped remediation, auto-resolved mistakes, weak mastery evidence, or fallback-question risks.

### Learning Enforcement Integrity

Rating: Medium-Low

Evidence:

- The architecture has the right enforcement components.
- Enforcement is inconsistent because multiple old and new mastery/progress paths still coexist.
- The strongest gates are route-specific rather than system-wide invariants.

## 11. Recommendations

### Critical: Must Fix Before Pilot

1. Stop auto-resolving mistakes from shared skill mastery alone.
   - File: `utils/masteryEngine.js`
   - Replace bulk `Mistake.updateMany(... status: resolved ...)` with evidence-aware resolution.
   - Skill mastery may inform a mistake, but should not erase unresolved mistake evidence.

2. Make skill mastery evidence-aware.
   - Files: `utils/masteryEngine.js`, `routes/mastery.js`, `services/mathpath/masteryCriteriaEngine.js`
   - Require at least one of:
     - independent follow-up success
     - mastery check success
     - recheck success
     - verified mistake correction plus later independent success

3. Route MistakeReview "Try Again" through the enforced detail/correction flow or record it as recovery evidence.
   - Files: `frontend/src/pages/student/mathpath/MistakeReview.jsx`, `frontend/src/pages/student/mathpath/MistakeDetail.jsx`
   - Avoid allowing direct similar practice to bypass correction.

4. Add system-level unresolved mistake gate before showing skill-level mastery claims.
   - Files: `routes/mastery.js`, parent/tutor dashboards, progress pages
   - If a skill has unresolved mistakes without evidence, label it as "accurate in recent practice, still needs mistake review" rather than mastered.

5. Tighten Recovery Pack fallback mastery checks.
   - Files: `services/mathpath/recoveryPackTeachingFlowService.js`, `frontend/src/pages/student/mathpath/RecoveryPackTeachingFlow.jsx`
   - Fallback questions should not satisfy mastery check unless adult/system-verifiable evidence exists.

### Important: v0.1 Improvements

1. Persist RemediationPanel engagement.
   - Track viewed steps, completed worked example, guided attempt, and retry.

2. Add learning-chain status to every mistake.
   - Example: `unreviewed`, `review_started`, `correction_needed`, `understanding_needed`, `recovery_needed`, `recheck_needed`, `resolved_with_evidence`.

3. Add parent/tutor risk cards.
   - Show reviewed-without-evidence, unresolved mistake chains, missing working, and recheck pending.

4. Make working quality influence mastery confidence.
   - Missing or insufficient working should lower confidence for high-working skills.

5. Link similar-practice success back to the original mistake.
   - A successful similar question should create explicit `masteryEvidence` or `recoveryEvidence`, not just general practice accuracy.

6. Separate mistake-level mastery from skill-level mastery in all reports.
   - Avoid parent claims that imply a corrected mistake equals skill mastery.

### Future Enhancements

1. Add adaptive "must correct before next session" policies for high-confidence wrong answers.
2. Add misconception-specific recheck selection and scoring.
3. Add adult override with evidence requirements.
4. Add longitudinal learning-chain analytics:
   - mistake created
   - reflection completed
   - correction passed
   - guided practice completed
   - independent practice passed
   - recheck passed
5. Add automated QA that tries to bypass the learning loop and fails if mastery is awarded too early.

## 12. Sprint B Implementation Target

The recommended Sprint B should be:

Mistake-to-Mastery Enforcement Unification

Scope:

1. Make `learningStatus` the authoritative mistake-learning state.
2. Stop aggregate mastery from directly resolving mistakes.
3. Add evidence-aware mastery guards to shared and Fractions-specific mastery paths.
4. Require unresolved mistakes to be corrected or explicitly superseded by independent/recheck evidence.
5. Add parent/tutor/admin visibility for skipped or unresolved learning chains.

Success criterion:

A student should not be able to receive a credible mastery claim for a skill while there are unresolved, evidence-free mistakes for that skill.


# Mistake Learning Enforcement Audit

Date: 2026-06-07

Scope:

- Student MathPath practice flow
- Diagnostic result flow
- Mistake Review flow
- Remediation / Recovery Pack flow
- Recheck / follow-up question flow
- Progress/mastery status update logic
- Parent/tutor/adult visibility where currently present

No production code, tests, or routes were changed.

## 1. Executive Summary

Verdict: **students can currently skip the learning step after a mistake.**

Tian OS records mistakes and can show explanations, working review, remediation steps, and similar-practice CTAs. However, the current flow does not require the student to prove that they understood the mistake before moving on.

The implemented flow is closer to:

Wrong → Mistake recorded → Explanation/remediation shown optionally → Student may continue practice

It is not yet:

Wrong → Reflection → Guided Correction → Recheck → Corrected → Mastered

Key findings:

- Mistakes are recorded from practice and diagnostic attempts.
- Some mistakes are tagged with misconception/root-cause metadata, especially diagnostic mistakes and generated fraction mistakes when metadata exists.
- Review/remediation is mostly optional and acknowledgement-based.
- “Mark as reviewed” changes status from `open` to `reviewed` with no proof of understanding.
- Remediation steps are progressively disclosed, but the student can ignore them or reveal them without answering a scaffolded correction.
- Practice result allows “Continue MathPath” even when mistakes exist.
- Mastery/progress updates from answer accuracy, not from explanation engagement.
- Mistakes become `resolved` when the underlying `MasteryRecord` reaches mastered, not when the original mistake is explicitly corrected/rechecked.
- Parent/tutor dashboards can see unresolved mistakes and working evidence, but cannot reliably identify whether a student skipped the explanation or failed to complete correction.

## 2. Current Implemented Flow

### A. Practice Answer Incorrect

Practice submission persists attempts, creates mistake records, updates skill state, records telemetry, and completes the session.

Evidence:

- `frontend/src/pages/student/mathpath/PracticeSession.jsx:420-457`
- `frontend/src/pages/student/mathpath/PracticeSession.jsx:1240-1316`
- `routes/mastery.js:522-592`
- `routes/mastery.js:603-616`

Current behaviour:

1. Student submits practice.
2. Wrong responses are included in generated mistake payloads.
3. Persisted practice route writes:
   - `MathPathAttempt`
   - `MathPathMistakeRecord`
   - shared `Mistake`
   - `MathPathStudentSkillState`
4. Student sees practice result.
5. If mistakes exist, student can click “Review mistakes”.
6. Student can also click “Continue MathPath” without reviewing.

Evidence for skip path:

- `frontend/src/pages/student/mathpath/PracticeResult.jsx:114-122`

### B. Diagnostic Answer Incorrect

Diagnostic completion creates mistake records for wrong/skipped answers and stores placement result.

Evidence:

- `routes/mastery.js:1320-1366`
- `routes/mastery.js:1370-1555`

Current behaviour:

1. Wrong/skipped diagnostic answers create shared `Mistake` records.
2. Diagnostic mistakes may include:
   - `mistakeId`
   - `mistakeCategory`
   - `severity`
   - `rootCauseMapping`
   - `skillMapping`
   - `interventionPathway`
   - confidence/reflection/help signals
3. Diagnostic result recommends next practice.
4. Student is not required to correct each diagnostic mistake before continuing.

### C. Mistake Review

Mistake Review displays:

- mistake question
- student answer
- correct answer
- worked solution
- working review if available
- Try Together
- Try Again
- model trainer link if available

Evidence:

- `frontend/src/pages/student/mathpath/MistakeReview.jsx`
- `frontend/src/pages/student/mathpath/MistakeDetail.jsx:141-187`

Current behaviour:

- Student may read the mistake.
- Student may click “Mark as reviewed”.
- Student may open remediation help.
- Student may start similar practice.
- There is no required reflection, correction step, or proof-of-understanding gate.

### D. Remediation Panel

Remediation uses progressive disclosure:

- reassure
- hint
- prerequisite warm-up
- worked example
- guided replication
- retry

Evidence:

- `utils/remediationEngine.js`
- `frontend/src/components/mathpath/RemediationPanel.jsx:21-64`
- `routes/mastery.js:1736-1756`

Current behaviour:

- Remediation is generated and displayed one step at a time.
- Student can click “Show the next step”.
- There is no required answer input inside the remediation panel.
- There is no “completed remediation step” record, except `working_used_for_remediation` telemetry when working insight is used.

### E. Recheck / Follow-Up

Recheck exists through Recovery Pack/assignment flow and diagnostic recheck summaries.

Evidence:

- `services/mathpath/studentRecheckSummaryService.js`
- `services/mathpath/recheckRecommendationService.js`
- `services/mathpath/masteryCriteriaEngine.js`

Current behaviour:

- Recheck is available after assignment/recovery pack flow.
- Recent learning path work added stronger recheck gating for Recovery Packs.
- But ordinary Mistake Review does not require a similar recheck question before a mistake is considered reviewed.
- Shared `Mistake.status` resolves only through skill mastery, not per-mistake correction.

### F. Mastery / Progress

Mastery is answer-score based.

Evidence:

- `utils/masteryEngine.js:59-106`
- `routes/mastery.js:603-616`

Current behaviour:

- `MasteryRecord` score updates from attempts.
- `MathPathStudentSkillState` updates from practice-session accuracy.
- Existing open/reviewed mistakes for a skill are set to `resolved` when the skill reaches `mastered`.
- Mastery is not directly tied to whether the student completed mistake reflection/remediation.

## 3. Gap Analysis Against Target Flow

Target:

Wrong → Reflection → Guided Correction → Recheck → Corrected → Mastered

| Stage | Current Status | Gap |
| --- | --- | --- |
| Wrong | Implemented | Practice and diagnostic wrong answers are recorded. |
| Reflection | Missing / optional only | Confidence exists before/with answer, but no post-mistake reflection is required. |
| Guided Correction | Partially implemented | Remediation is displayed, but no required correction task exists. |
| Recheck | Partially implemented | Recovery Pack rechecks exist, but per-mistake similar recheck is not required. |
| Corrected | Missing | No distinct `corrected` status for a mistake after a successful similar item. |
| Mastered | Implemented at skill level | Skill mastery can resolve mistakes, but this may not prove the original misconception was corrected. |

## 4. Evidence From Files Inspected

### Mistake Models

`models/Mistake.js`

Relevant fields:

- `attemptId`
- `skillId`
- `studentAnswer`
- `correctAnswer`
- `confidence`
- `workingSubmitted`
- `workingInsight`
- `mistakeCategory`
- `mistakeType`
- `misconceptionTag`
- `reviewed`
- `reviewedAt`
- `reviewSource`
- `status`

Current status enum:

- `open`
- `reviewed`
- `resolved`

Evidence:

- `models/Mistake.js:1-116`

Gap:

No status for:

- `correction_required`
- `correction_attempted`
- `corrected`
- `recheck_required`
- `rechecked`
- `mastered`

`models/mathpath/MathPathMistakeRecord.js`

Stores aggregate mistake frequency by code/skill/family but not per-student correction stage.

Evidence:

- `models/mathpath/MathPathMistakeRecord.js`

### Mistake API

`routes/mistakes.js`

Mistakes are retrieved by default with `status != resolved`.

Evidence:

- `routes/mistakes.js:96-142`

Mistakes can be bulk-created from generated practice.

Evidence:

- `routes/mistakes.js:151-191`

Review endpoint is acknowledgement-based:

```text
m.reviewed = true
m.status = 'reviewed'
```

Evidence:

- `routes/mistakes.js:237-253`

Gap:

No correction answer, scaffolded response, read-depth metric, or recheck result is required by the review endpoint.

### Practice Result

`frontend/src/pages/student/mathpath/PracticeResult.jsx`

The result page shows mistakes and has a Review Mistakes button, but also provides Continue MathPath.

Evidence:

- `frontend/src/pages/student/mathpath/PracticeResult.jsx:95-122`

Gap:

The student can move on immediately.

### Mistake Detail

`frontend/src/pages/student/mathpath/MistakeDetail.jsx`

Shows:

- mistake
- correct answer
- why
- working review
- Mark as reviewed
- Try Together
- Try Again

Evidence:

- `frontend/src/pages/student/mathpath/MistakeDetail.jsx:127-187`

Gap:

“Mark as reviewed” can be clicked without:

- reading-time threshold
- choosing mistake type
- correcting the first wrong step
- answering a scaffolded item
- completing Try Together
- passing Try Again

### Remediation

`frontend/src/components/mathpath/RemediationPanel.jsx`

Reveals one step at a time but does not collect proof of learning.

Evidence:

- `frontend/src/components/mathpath/RemediationPanel.jsx:21-64`

`utils/remediationEngine.js`

Builds useful remediation steps and can use working insight.

Evidence:

- `utils/remediationEngine.js`

Gap:

No remediation attempt/result model is enforced for ordinary mistake review.

### Mastery

`utils/masteryEngine.js`

Mastery is derived from attempts, score, and fluency. Once a skill is mastered, open mistakes for that skill are marked `resolved`.

Evidence:

- `utils/masteryEngine.js:59-106`

Gap:

This is better than resolving mistakes merely because an explanation was displayed, but it does not prove the original misconception was explicitly corrected. A student might master enough similar questions later without completing the original mistake-learning loop.

## 5. Answers to Audit Questions

### 1. When a student answers incorrectly, where is the mistake recorded?

Practice:

- `MathPathAttempt`
- `MathPathMistakeRecord`
- shared `Mistake`

Diagnostic:

- `MathPathAttempt`
- shared `Mistake`
- `MathPathMistakeRecord`

Key files:

- `routes/mastery.js`
- `routes/mistakes.js`
- `models/Mistake.js`
- `models/mathpath/MathPathMistakeRecord.js`

### 2. Is the wrong answer mapped to a specific misconception or only marked as wrong?

Status: **Partial**

Diagnostic mistakes can include rich classification:

- `mistakeId`
- `mistakeCategory`
- `severity`
- `rootCauseMapping`
- `skillMapping`
- `interventionPathway`

Generated practice mistakes mostly rely on:

- `result.misconceptionTag`
- `question.misconceptionTag`
- fallback `practice_error`

Some errors are only marked as wrong if question metadata lacks misconception support.

### 3. Is the solution/remediation merely displayed, or does the student need to interact with it?

Status: **Mostly displayed**

Students can click through remediation steps, but no proof response is required.

### 4. Can the student click Next / Continue without reading or completing remediation?

Status: **Yes**

Practice result allows `Continue MathPath` even when mistakes exist.

Mistake detail allows navigation away or direct Try Again without Mark as reviewed/Try Together.

### 5. Is there any timing/read-depth signal that proves the explanation was viewed?

Status: **No reliable signal found**

Telemetry captures question answer/skip/confidence/working signals. It does not appear to capture:

- explanation opened
- explanation dwell time
- remediation step viewed
- remediation completed
- mistake detail dwell time

### 6. Is there any micro-reflection step?

Status: **No required post-mistake micro-reflection**

Existing confidence/reflection happens during answer submission, not after the mistake is explained.

No required:

- choose mistake type
- correct first wrong step
- answer scaffolded check
- explain why original answer was wrong

### 7. Is a similar recheck question required before the system marks the mistake corrected?

Status: **No for ordinary mistakes**

Recovery Pack/recheck flow exists, but shared mistakes do not have per-mistake `corrected` or `rechecked` status.

### 8. What status labels currently exist for mistakes?

Shared `Mistake.status`:

- `open`
- `reviewed`
- `resolved`

Related boolean:

- `reviewed`

MathPath aggregate record:

- no correction status; it tracks frequency/severity/evidence.

Missing statuses:

- `wrong`
- `correction_required`
- `corrected`
- `rechecked`
- `mastered`

### 9. Does mastery/progress update simply because remediation was shown, or only because the student demonstrated recovery?

Status: **Progress/mastery does not update merely because remediation is shown.**

Mastery/progress updates from answer attempts and accuracy.

However:

- mistake `reviewed` can be set merely by clicking Mark as reviewed
- mistake `resolved` is skill-mastery-derived, not per-mistake-correction-derived

### 10. Can parent/tutor/teacher dashboards identify mistakes that were skipped, unresolved, or not yet rechecked?

Status: **Partial**

They can see:

- unresolved mistakes via `status != resolved`
- source such as `diagnostic-skipped`
- working evidence/working insights where linked
- weak skills and recommendations

They cannot reliably see:

- explanation skipped
- remediation opened but not completed
- correction attempted but failed
- recheck pending for a specific mistake
- post-mistake reflection quality

## 6. Missing Enforcement Points

1. No required post-mistake reflection.
2. No required correction task before `reviewed`.
3. No remediation completion event.
4. No dwell-time/read-depth signal for explanations.
5. No per-mistake recheck requirement.
6. No `corrected` status.
7. No `rechecked` status.
8. No parent/tutor visibility into skipped explanations.
9. No distinction between “saw answer” and “understood mistake”.
10. No explicit link from a successful similar question back to the original mistake.

## 7. Risk Rating

### Can students skip learning?

Risk: **High**

Reason:

Students can continue after a wrong practice session, ignore Mistake Review, or click Mark as reviewed without completing a correction.

### Is mastery over-counted?

Risk: **Medium**

Reason:

Skill mastery is answer-attempt based, which is stronger than display-based mastery. However, mistake resolution happens at skill level, not at the original misconception/mistake level. A student may be considered resolved without completing the mistake-learning loop.

### Is parent/tutor visibility sufficient?

Risk: **Medium**

Reason:

Adults can see mistake and working evidence, but not whether explanation/remediation was skipped or whether a specific mistake has been corrected/rechecked.

## 8. Recommended Implementation Plan

### Quick Fixes

1. Add mistake interaction telemetry:
   - `mistake_detail_viewed`
   - `mistake_explanation_viewed`
   - `remediation_step_viewed`
   - `remediation_panel_opened`
   - `try_again_started`
   - `mistake_review_skipped`

2. Replace “Mark as reviewed” with safer language:
   - `I have read this`
   - or `I understand the mistake`

3. Add a lightweight confirmation before reviewed:
   - “What happened?”
   - choices: `wrong method`, `calculation slip`, `misread question`, `not sure`

4. On PracticeResult, make Review Mistakes the primary CTA when mistakes exist.

5. Add adult label:
   - `not reviewed`
   - `viewed only`
   - `needs correction`

### Proper v0.1 MVP Fixes

1. Extend `Mistake.status`:
   - `open`
   - `viewed`
   - `reflection_completed`
   - `correction_attempted`
   - `corrected`
   - `recheck_required`
   - `rechecked`
   - `resolved`

2. Add `MistakeLearningAttempt` or equivalent:
   - `mistakeId`
   - `studentId`
   - `reflectionChoice`
   - `correctionPromptId`
   - `studentCorrectionAnswer`
   - `correctionCorrect`
   - `timeOnExplanationMs`
   - `remediationStepsViewed`
   - `similarQuestionId`
   - `similarQuestionCorrect`

3. Add enforced guided correction:
   - choose mistake type
   - correct the first wrong step
   - answer one scaffolded near-transfer item

4. Link Try Again results back to original `mistakeId`.

5. Only mark a mistake `corrected` when the student passes the correction task or linked similar question.

6. Only mark `resolved` when:
   - mistake corrected
   - similar recheck passed
   - skill mastery evidence is sufficient

7. Parent/tutor dashboard flags:
   - `unreviewed`
   - `viewed but not corrected`
   - `correction failed`
   - `recheck pending`
   - `resolved by recheck`

### Later Premium / AI-Enhanced Fixes

1. AI reads student explanation:
   - “Why was your first answer wrong?”
   - classify conceptual/procedural/careless/misread.

2. AI compares new working against old working.

3. Adaptive misconception-specific correction:
   - different micro-task per misconception.

4. Tutor/parent review queue:
   - mistakes with low correction confidence.

5. Learning analytics:
   - explanation dwell time vs correction success.
   - repeated skipped-remediation behaviour.

## 9. Acceptance Criteria for Next Sprint

The next sprint should be considered successful when:

1. A wrong answer creates a mistake with `open` status.
2. Opening Mistake Detail records a `mistake_detail_viewed` event.
3. Viewing explanation records a timestamp/read event.
4. Student must complete one post-mistake reflection before marking as reviewed.
5. Student must answer one scaffolded correction or similar item before status becomes `corrected`.
6. “Reviewed” cannot be achieved by a single button click with no evidence.
7. Try Again practice includes `originMistakeId`.
8. Correct Try Again result updates that mistake to `corrected` or `rechecked`.
9. Parent/tutor dashboards can distinguish:
   - unreviewed
   - viewed only
   - correction attempted
   - corrected
   - recheck pending
10. Mastery/progress is not reduced, but mistake resolution is no longer inferred solely from explanation display.

## 10. Final Verdict

Tian OS has a strong foundation for mistake capture and remediation display, especially with working evidence and misconception metadata. The enforcement layer is not yet complete.

Current risk:

- Students can skip learning: **High**
- Mastery over-counting: **Medium**
- Adult visibility: **Medium**

Recommended next sprint:

Build **Mistake Learning Enforcement MVP**:

Wrong → View Explanation → Reflection → Scaffolded Correction → Similar Recheck → Corrected

This should be implemented before positioning Mistake-to-Mastery as proof that a student has understood and fixed a mistake.

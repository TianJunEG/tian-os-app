# MathPath Fluency & Retention Engine

**Status:** Working documentation
**Last updated:** June 2026
**Source files:** `utils/fluencyEngine.js`, `models/FluencyRecord.js`, `models/RetentionReview.js`, `models/mathpath/MathPathStudentSkillState.js`

---

## 1. Concepts

**Mastery** and **fluency** are distinct.

- **Mastery** means a student can answer correctly (`MasteryRecord.score ≥ 70`). It measures accuracy.
- **Fluency** means a student can answer *quickly and accurately with confidence*. It measures speed + accuracy + confidence combined. A student can be mastered but not yet fluent.
- **Retention** means a student who became fluent still recalls the skill after time has passed. It is verified via spaced-repetition reviews.

The three are a progression: `mastered → fluent → retained`.

---

## 2. Fluency score formula

Source: `utils/fluencyEngine.js` → `calculateFluencyScore()`

```
fluencyScore = (accuracy × 0.60) + (speedScore × 0.25) + (confidenceScore × 0.15)
```

All components are 0–100. The result is rounded to one decimal place.

### Accuracy component (60%)

Raw percentage of correct answers in the session:

```
accuracy = (correctAnswers / totalQuestions) × 100
```

### Speed component (25%)

How fast the student answers relative to a per-skill `targetSeconds` threshold:

```
if averageTime ≤ targetSeconds:          speedScore = 100
if averageTime ≥ targetSeconds × 4:      speedScore = 0
otherwise:                               speedScore = ((targetSeconds × 4 − averageTime) / (targetSeconds × 3)) × 100
```

If no timing data is available, `speedScore = 0`.

### Confidence component (15%)

Student's stated confidence, normalised to 0–100:

| Student input | Normalised value |
|---|---|
| `high`, `confident`, `very confident`, `i know this` | 100 |
| `medium`, `not sure`, `unsure` | 65 |
| `low`, `guess`, `i don't know`, `not confident` | 35 |
| Numeric 0–1 | ×100 |
| Numeric 1–100 | as-is |
| Not provided | 60 (neutral default) |

### Fluency status thresholds

| Score | Status |
|---|---|
| ≥ 85 | `fluent` |
| 60–84 | `developing` |
| < 60 | `not_fluent` |

---

## 3. Computing fluency metrics from attempts

Source: `calculateFluencyMetrics({ skillCode, attempts, targetSeconds })`

Takes an array of raw attempt objects and returns the full metrics record. Handles:

- Normalising timing (derives `timeTakenSeconds` from `questionStartTime`/`questionSubmitTime` if explicit `timeTakenSeconds` is absent)
- Normalising confidence strings to numeric values
- Normalising working-submission flags (`workingSubmitted`, `workingUploaded`, `fullscreenWorkingSubmitted`)
- Skipped questions counted separately; excluded from accuracy and speed calculations

Returns:

```js
{
  skillCode,
  totalQuestions,
  correctAnswers,
  accuracy,             // %
  averageTimeSeconds,
  confidenceAverage,    // 0–100
  workingSubmissionRate,// %
  fluencyScore,         // 0–100
  fluencyStatus,        // 'not_fluent' | 'developing' | 'fluent'
  components: { accuracy, speed, confidence },
  skippedQuestions,
}
```

---

## 4. FluencyRecord model

Source: `models/FluencyRecord.js`

One record per `studentId × skillId`. Updated after each fluency session by the mastery engine.

| Field | Notes |
|---|---|
| `fluencyScore` | 0–100 composite |
| `fluencyStatus` | `not_fluent \| developing \| fluent` |
| `accuracy` | % correct in most recent session |
| `averageTimeSeconds` | Average response time |
| `confidenceAverage` | 0–100 |
| `workingSubmissionRate` | % of questions with working submitted |
| `becameFluentAt` | Timestamp when status first reached `fluent`; triggers retention scheduling |
| `history` | Array of past session summaries |

---

## 5. MathPathStudentSkillState fluency levels

Source: `models/mathpath/MathPathStudentSkillState.js`

The `fluencyLevel` field uses a finer-grained bronze/silver/gold/platinum scale:

| Level | Meaning |
|---|---|
| `notReady` | Skill not yet mastered; fluency training not started |
| `bronze` | First fluency session completed; score < 70 |
| `silver` | Score 70–84 across multiple sessions |
| `gold` | Score ≥ 85 (`fluent`) |
| `platinum` | Retained after all spaced-repetition reviews |

---

## 6. Retention scheduling

Source: `buildRetentionReviews()` in `utils/fluencyEngine.js`

When a skill's `fluencyStatus` reaches `fluent` for the first time (`becameFluentAt` is set), four retention reviews are scheduled automatically on a spaced-repetition schedule:

```
Review 1:  fluentAt + 3 days
Review 2:  fluentAt + 7 days
Review 3:  fluentAt + 14 days
Review 4:  fluentAt + 30 days
```

Each review is stored as a `RetentionReview` record:

```js
{
  studentId,
  skillId,
  skillCode,
  reviewDate,       // scheduled date
  intervalDays,     // 3, 7, 14, or 30
  completed: false,
  retained: false,
  status: 'scheduled',
}
```

### Review outcomes

| Outcome | Effect on MathPathStudentSkillState |
|---|---|
| Correct in review | `retentionStatus: 'retained'`; next review scheduled |
| Incorrect in review | `retentionStatus: 'needsReview'`; practice session assigned |
| All 4 reviews passed | `fluencyLevel: 'platinum'`, `retentionStatus: 'retained'` |
| Missed review + wrong | `retentionStatus: 'forgotten'`; skill re-enters practice queue |

### RetentionReview model

Source: `models/RetentionReview.js`

Queried by the orchestrator to surface due reviews on the student dashboard and in adult dashboards.

---

## 7. Fluency vs mastery in dashboards

Adult dashboards (parent, tutor, teacher) distinguish these states:

| State | How shown |
|---|---|
| `needs_review` (mastery < 40) | "Needs support" |
| `learning` (mastery 40–69) | "Learning" |
| `mastered` (mastery ≥ 70) | "Mastered" |
| `fluent` (fluency ≥ 85) | "Fluent" |
| `retained` (all reviews passed) | "Retained" |
| `forgotten` (failed retention) | Reverts to "Needs support" |

Parent mascot narration (`frontend/src/mathpath/dashboard/parentMascotNarration.js`) uses `fluencyStatus` and `retentionStatus` to generate the weekly progress summary.

---

## 8. File map

| File | Role |
|---|---|
| `utils/fluencyEngine.js` | Core calculation functions (formula, normalisation, retention scheduling) |
| `utils/fluencyEngine.test.js` | Unit tests for score formula and normalisation |
| `utils/fluencyEngineCompletion.test.js` | Integration tests for session completion flows |
| `models/FluencyRecord.js` | Per-student × skill fluency record (MongoDB) |
| `models/RetentionReview.js` | Spaced-repetition review records (MongoDB) |
| `models/mathpath/MathPathStudentSkillState.js` | Extended skill state including `fluencyLevel` and `retentionStatus` |
| `routes/fluency.js` | Fluency API endpoints |
| `routes/fluencyEngineRoutes.test.js` | API-level fluency tests |
| `shared/mathpath/fractions/fractionFluencyEngine.js` | Fractions-specific fluency wrapper |
| `shared/mathpath/fractions/fractionRetentionEngine.js` | Fractions-specific retention wrapper |
| `shared/mathpath/percentages/percentageFluencyEngine.js` | Percentage fluency (added PR #291) |
| `shared/mathpath/ratioRate/ratioRateFluencyEngine.js` | Ratio/Rate fluency (added PR #293) |
| `scripts/seedFluency.js` | Seeds fluency demo content (`npm run seed:fluency`) |

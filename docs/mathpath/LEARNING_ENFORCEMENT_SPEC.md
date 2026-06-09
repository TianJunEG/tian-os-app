# MathPath Learning Enforcement Specification

Last updated: 2026-06-10

---

## 1. Overview

The Mistake-to-Mastery learning enforcement system governs how students progress from detecting a mistake to demonstrating mastery. Each mistake has a `learningStatus` field on the `Mistake` model that tracks its position in a five-stage pipeline. Transitions require evidence and are enforced server-side.

---

## 2. Learning Status Progression

```
new -> acknowledged -> corrected -> understood -> mastered
```

| Status | Student-facing label | Meaning |
|---|---|---|
| `new` | "Ready to learn from this mistake" | Mistake detected from practice or diagnostic |
| `acknowledged` | "You found the mistake" | Student has opened and reviewed the mistake |
| `corrected` | "You fixed the mistake" | Student provided a valid reflection and correct answer |
| `understood` | "You showed understanding" | Student demonstrated conceptual understanding |
| `mastered` | "You can solve similar questions" | Student provided independent evidence of mastery |

---

## 3. Transition Rules

### new -> acknowledged

- **Trigger**: Student opens the mistake detail view.
- **Evidence**: None beyond viewing. Sets `reviewed = true`.
- **Side effect**: `status` changes from `open` to `reviewed`.

### acknowledged -> corrected

- **Required fields**: `reflection` (string, >= 8 characters), `correctionAttempt` (string, non-empty).
- **Validation**: `correctionAttempt` is normalised (lowercase, whitespace-stripped) and compared against stored `correctAnswer`. Must match exactly or as a substring.
- **Rejection**: If correction does not match, status remains `acknowledged`. Response includes `correctionCorrect: false`.

### corrected -> understood

- **Required fields**: `understandingAnswer` (string, >= 8 characters).
- **Prerequisite**: Must already be in `corrected` status, or the correction attempt must match the correct answer.
- **Validation**: `understandingPassed()` checks length >= 8 trimmed characters.

### understood -> mastered

- **Required fields**: `masteryEvidence.evidenceType` -- one of:
  - `successful_correction` -- student corrected this specific mistake
  - `guided_question` -- correct answer on a guided practice question
  - `independent_question` -- correct answer on an independent question
  - `recheck` -- passed a recheck assessment (can bypass `understood` requirement)
- **Prerequisite**: Must be in `understood` status (unless evidence type is `recheck`).
- **Side effects**: Sets `resolved = true`, `status = 'resolved'`.

---

## 4. API Endpoint

### `PATCH /api/mistakes/:id/learning`

**Auth**: `protect` middleware (JWT required).
**Access control**: Calls `resolveStudent(req, mistake.studentId)` to verify the caller has access.

**Request body**:

```json
{
  "action": "acknowledge | correct | understand | master",
  "reflection": "string (for correct action)",
  "correctionAttempt": "string (for correct action)",
  "understandingAnswer": "string (for understand action)",
  "masteryEvidence": {
    "evidenceType": "successful_correction | guided_question | independent_question | recheck",
    "sourceId": "optional session/question reference",
    "note": "optional free text"
  },
  "source": "student | tutor | teacher"
}
```

**Response** (success):

```json
{
  "id": "mistake_id",
  "status": "reviewed | resolved",
  "reviewed": true,
  "learningStatus": "acknowledged | corrected | understood | mastered",
  "correctionCorrect": true,
  "understandingPassed": true,
  "mastered": false,
  "message": "Human-readable feedback string"
}
```

**Errors**: 404 (mistake not found), 403 (no access), 400/500 (validation or server error).

---

## 5. Enforcement Implementation

- **File**: `services/mathpath/mistakeCorrectionFlow.js`
- **Entry point**: `applyMistakeLearningAction(mistake, payload)`
- **Normalisation**: `correctionMatches()` lowercases and strips whitespace from both expected and submitted answers before comparison.
- **Minimum reflection length**: 8 trimmed characters (enforced by `hasUsefulReflection()`).

---

## 6. Integration Points

### Practice flow

- Incorrect answers in `PracticeSession` create `Mistake` records with `learningStatus: 'new'`.
- `MistakeDetail.jsx` renders the review UI and calls `PATCH /api/mistakes/:id/learning` on each action.

### Mistake review UI

- `MistakesHome.jsx` lists all mistakes with learning status badges.
- `MistakeReview.jsx` provides guided review flow.
- `MistakeDetail.jsx` renders per-status action buttons (acknowledge, correct, understand, master).
- Badge tones: `success` for mastered, `gold` for new, `navy` for intermediate states.

### Parent and tutor views

- `MistakeCard.jsx` (parent) and `TutorStudentProfile.jsx` (tutor) display learning status read-only.
- No parent/tutor action to advance learning status -- student must do the work.

# Paper Review Architecture

Phase 6 architecture for Tian OS paper review.

Scope: P4-P6 Mathematics papers. This is not a test generator, full OCR system, or automatic all-subject marking engine.

## Core Flow

```text
Uploaded School Paper
-> Question Extraction
-> Student Answer Extraction
-> Working Extraction
-> Skill Mapping
-> WordPath Structure Mapping
-> Misconception Detection
-> Remediation Plan
```

The system must be honest about uncertainty. If extraction or mapping confidence is low, it should request manual review rather than showing fake analysis as real.

## Data Models

Phase 6A adds multi-level evidence support. See `PAPER_REVIEW_EVIDENCE_MODEL.md` for the full evidence model.

### Paper Upload

Implemented in:

`models/mathpath/MathPathPaperUpload.js`

Shape:

```js
{
  paperId,
  studentId,
  uploadedBy,
  paperType,
  level,
  subject,
  topicFocus,
  fileUrls,
  uploadedAt,
  status,
  evidenceLevel,
  hasQuestionPaper,
  hasMarkedPaper,
  hasAnswers,
  hasWorking,
  confidenceLevel
}
```

Supported `paperType` values:

- `school_test`
- `worksheet`
- `topical_test`
- `weighted_assessment`
- `exam_paper`

Supported status values:

- `uploaded`
- `extracting`
- `needs_review`
- `mapped`
- `analysed`
- `remediation_ready`
- `failed`

### Paper Review Session

Implemented in:

`models/mathpath/MathPathPaperReviewSession.js`

Shape:

```js
{
  reviewId,
  paperId,
  studentId,
  status,
  extractedQuestions,
  extractedAnswers,
  extractedWorking,
  mappedSkills,
  mappedWordStructures,
  detectedMistakes,
  remediationPlan,
  parentSummary,
  tutorSummary,
  evidenceLevel,
  reviewQuality,
  evidenceLimitations,
  workingAnalysisEnabled,
  createdAt,
  completedAt
}
```

## Evidence Levels

Paper Review supports three levels:

- Level 1: Basic Review - paper only, LOW confidence
- Level 2: Enhanced Review - paper + answers, MEDIUM confidence
- Level 3: Full Review - paper + answers + working, HIGH confidence

Working analysis is gated by `hasWorking === true`.

If working is unavailable, the system should show:

> We identified weak skills from the paper, but working was not available for method analysis.

## Extraction Pipeline

Implemented as architecture helpers in:

`services/mathpath/paperReviewArchitectureService.js`

Pipeline stages:

1. `question_number_detection`
2. `question_detection`
3. `answer_detection`
4. `working_detection`
5. `marks_detection`
6. `manual_review`

MVP rule:

Manual correction is allowed after extraction. Low-confidence extraction should set `needs_review`.

## Extraction Outputs

### Extracted Question

```js
{
  questionNumber,
  questionText,
  marks,
  pageNumber,
  cropUrl,
  extractionConfidence,
  needsManualReview
}
```

### Extracted Answer

```js
{
  questionNumber,
  studentAnswer,
  correctAnswer,
  marksAwarded,
  extractionConfidence,
  needsManualReview
}
```

### Extracted Working

```js
{
  questionNumber,
  workingAvailable,
  workingImageCropUrl,
  ocrText,
  methodAnalysis,
  missingSteps,
  calculationSlips,
  modelMethodIssues,
  extractionConfidence
}
```

## Skill Mapping

Each extracted question maps to MathPath micro-skills:

```js
{
  questionNumber,
  domain,
  topic,
  microSkill,
  confidenceScore,
  needsManualReview
}
```

Current Phase 6 uses the Fractions Knowledge Map V1 as the target architecture. This is a lightweight mapping layer, not a claim of complete AI marking.

## WordPath Mapping

If a question appears to be a word problem, it also maps to WordPath:

```js
{
  questionNumber,
  wordStructure,
  wordMicroSkill,
  modelType,
  confidenceScore,
  needsManualReview
}
```

WordPath allows the system to detect:

- computation skill is secure but interpretation is weak
- problem structure is weak even when topic knowledge exists
- model-method issue is present

## Mistake Detection

For wrong questions:

```js
{
  questionNumber,
  studentAnswer,
  correctAnswer,
  answerCorrect,
  workingAvailable,
  likelyMistakeType,
  likelyMisconception,
  evidence
}
```

Evidence can include:

- student answer
- OCR working text
- mapped misconception behaviour
- model-method issue
- missing step

## Working Analysis Hooks

This phase does not overbuild OCR.

Hooks exist for:

- working image crop
- OCR text
- method analysis
- missing steps
- calculation slips
- model-method issues

Future working intelligence can populate these fields.

## Remediation Routing

Detected mistake:

```text
mistake -> microSkill -> misconception -> remediation pathway
```

Output:

```js
{
  skill,
  misconception,
  recommendedAction,
  recommendedAsset,
  estimatedMinutes
}
```

The routing uses:

- Fractions Knowledge Map V1
- Fractions Misconception Map V1
- Fractions Remediation Asset Map V1
- WordPath Knowledge Map V1 where word-structure evidence exists

## Parent Summary Payload

```js
{
  overallSummary,
  strongestAreas,
  needsAttention,
  suggestedActions,
  recommendedPractice
}
```

Example:

> Your child understands some fraction skills but struggled with word problems involving remainders.

Parent summaries must be plain-language and avoid technical diagnostic labels.

## Tutor Summary Payload

```js
{
  prioritySkills,
  rootCauses,
  evidence,
  recommendedLessonPlan,
  workingInsights
}
```

Tutor summaries can expose:

- micro-skill
- misconception ID
- working evidence
- WordPath structure
- recommended asset
- lesson focus

## Empty and Error States

Extraction failure:

> We could not read this paper clearly. Please upload a clearer image or review manually.

Low mapping confidence:

> Some questions need manual review before recommendations are generated.

## Known Limitations

- OCR accuracy is not guaranteed in this phase.
- Handwriting extraction is a hook, not a complete solution.
- The mapping layer is architecture-first and conservative.
- English, Science, and non-Math papers are out of scope.
- This does not generate exam papers.
- This does not create marketplace or tutor assignment logic.

## Manual Review Points

Manual review should be available after:

- question number detection
- question text extraction
- answer extraction
- working extraction
- skill mapping
- WordPath mapping
- low-confidence misconception detection

## Future OCR and AI Plan

Future phases can add:

1. OCR provider abstraction.
2. Question segmentation with bounding boxes.
3. Answer-region detection.
4. Working crop classification.
5. Method-step extraction.
6. AI-assisted skill and WordPath mapping.
7. Human review queue.
8. Confidence-calibrated marking.

No future phase should present uncertain analysis as confirmed.

## Tests

Added:

`utils/paperReviewArchitectureService.test.js`

Coverage:

- paper upload model
- review session creation
- question-to-skill mapping shape
- word problem mapping shape
- remediation plan output shape
- parent/tutor summary payloads
- failure state messaging

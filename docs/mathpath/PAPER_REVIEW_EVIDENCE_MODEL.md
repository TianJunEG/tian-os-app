# Paper Review Evidence Model

Phase 6A architecture for evidence-aware Tian OS Paper Review.

Paper Review must work when student working is unavailable. Working evidence improves confidence and depth, but it is not required for useful review.

## Evidence Levels

| Level | Review Quality | Inputs | Confidence | Capabilities | Limitations |
|---|---|---|---|---|---|
| Level 1 | Basic Review | Question paper, marked paper, or answer sheet without reliable student answers | LOW | Question extraction, skill mapping, WordPath mapping, weak-area detection, recommended remediation | No method analysis, no working analysis, no step analysis |
| Level 2 | Enhanced Review | Question paper + student answers | MEDIUM | Skill mapping, wrong-answer analysis, error pattern detection, WordPath mapping, remediation recommendations | No working/method/step analysis |
| Level 3 | Full Review | Question paper + student answers + student working | HIGH | Skill mapping, error analysis, working analysis, misconception detection, method analysis, root-cause analysis, tutor recommendations | OCR and method analysis still require confidence checks |

## Evidence Model

Implemented through:

- `models/mathpath/MathPathPaperUpload.js`
- `models/mathpath/MathPathPaperReviewSession.js`
- `services/mathpath/paperReviewArchitectureService.js`

Shape:

```js
{
  paperId,
  evidenceLevel,
  hasQuestionPaper,
  hasMarkedPaper,
  hasAnswers,
  hasWorking,
  confidenceLevel
}
```

Additional fields:

```js
{
  workingDeclaration,
  reviewQuality,
  evidenceLimitations,
  workingAnalysisEnabled
}
```

## Parent Working Declaration

After upload, the parent workflow should ask:

```text
Did the student use working?

○ Working uploaded
○ Working exists but unavailable
○ No working was used
```

Stored as:

- `working_uploaded`
- `working_exists_unavailable`
- `no_working_used`
- `unknown`

## Review Quality Copy

| Evidence Level | Student/Parent Display |
|---|---|
| Level 1 | ⭐ Basic Review - Paper only |
| Level 2 | ⭐⭐ Enhanced Review - Paper + Answers |
| Level 3 | ⭐⭐⭐ Full Review - Paper + Answers + Working |

## No-Working Output

When working is unavailable, parent summary should include:

> We identified weak skills from the paper, but working was not available for method analysis.

Tutor summary should include:

> Upload working for deeper misconception analysis.

## Working Analysis Gate

Only enable these when `hasWorking === true`:

- method analysis
- step analysis
- working insights
- OCR method evidence
- missing-step evidence
- model-method issue evidence

When `hasWorking === false`, these fields must remain empty and no fake working insight should be shown.

## What Still Works Without Working

### Paper Only

The system can still:

- extract question text
- map likely MathPath micro-skills
- map likely WordPath structures
- identify likely weak areas
- recommend manual review or broad remediation

Confidence is LOW.

### Paper + Answers

The system can additionally:

- detect wrong answers
- compare student and correct answers
- infer likely error patterns
- recommend targeted remediation assets

Confidence is MEDIUM.

### Paper + Answers + Working

The system can additionally:

- analyse method
- detect missing steps
- identify calculation slips
- identify model-method issues
- provide tutor-facing working insight

Confidence is HIGH.

## Future OCR Hooks

The evidence model is designed for future OCR expansion:

- question crop detection
- answer crop detection
- working crop detection
- handwritten OCR text
- method-step extraction
- confidence-calibrated marking
- manual correction queue

OCR confidence should upgrade or downgrade review quality only after evidence is verified.

## Safety Rule

Do not show method analysis unless working is available.

Do not show precise misconception/root-cause claims when only question paper evidence exists.

Prefer:

> This paper suggests these skills may need attention.

Avoid:

> Your child used the wrong method.

unless working or answer evidence supports it.

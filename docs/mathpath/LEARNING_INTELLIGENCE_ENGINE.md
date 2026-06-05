# Learning Intelligence Engine

Phase 7 architecture for central Tian OS learning intelligence.

This engine combines student evidence and produces ranked intervention priorities. It does not build UI, add question banks, or change existing student flows.

## Service

Implemented in:

`services/learning/learningIntelligenceService.js`

The service is domain-agnostic and input-driven. It can consume existing evidence records from MathPath, WordPath, paper review, working intelligence, fluency, mistakes, diagnostics, practice, and telemetry.

## StudentLearningProfile

Output shape:

```js
{
  studentId,
  strengths,
  weaknesses,
  misconceptions,
  confidenceRisks,
  workingPatterns,
  wordPathWeaknesses,
  fluencyWeaknesses,
  interventionPriorities,
  supportingEvidence
}
```

Every intervention priority includes supporting evidence. The engine does not invent data when evidence is missing.

## Supported Inputs

The engine accepts:

- diagnostic results
- practice attempts
- paper review results
- confidence selections
- working evidence
- fluency records
- mistake records
- WordPath mappings
- learning telemetry events

It is designed to work with existing models such as:

- `MathPathAttempt`
- `PracticeAttempt`
- `Mistake`
- `MathPathWorkingIntelligence`
- `FluencyRecord`
- `LearningTelemetryEvent`
- `MathPathPaperReviewSession`

## Evidence Aggregation

Evidence is grouped into:

- strengths
- weaknesses
- misconceptions
- confidence risks
- working patterns
- WordPath weaknesses
- fluency weaknesses

Examples:

| Evidence | Signal |
|---|---|
| Correct diagnostic + high confidence | strength |
| Repeated mistake on same skill | weakness |
| Wrong + high confidence | confidence risk |
| No working on high-requirement question | working pattern risk |
| Not fluent or low fluency score | fluency weakness |
| Paper review maps Fraction of Remainder | WordPath weakness |

## Priority Ranking Rules

Priorities use:

- severity
- frequency
- recency
- confidence risk
- working evidence
- fluency gap

Recent, repeated, severe, overconfident, and working-risk evidence receives higher priority.

## Recommended Actions

Supported recommendations:

- `concept_review`
- `guided_practice`
- `model_trainer`
- `fluency_drill`
- `wordpath_review`
- `tutor_intervention`

Rule examples:

| Signal | Recommended Action |
|---|---|
| Wrong + high confidence | `model_trainer` |
| No working on high-requirement question | `tutor_intervention` |
| Repeated mistake | `guided_practice` |
| Fluency score low | `fluency_drill` |
| WordPath structure weakness | `wordpath_review` |
| Isolated weak skill | `concept_review` |

## Safety Rules

- Do not show fake data.
- Do not create recommendations without supporting evidence.
- Do not treat paper-only review as method analysis.
- Do not expose raw developer diagnostics in parent/student copy.
- Use the engine as an internal prioritisation layer until UI integration is intentionally designed.

## Tests

Implemented in:

`utils/learningIntelligenceService.test.js`

Coverage:

- strengths detection
- weakness detection
- confidence risk
- no-working risk
- repeated mistakes
- fluency gap
- WordPath weakness
- intervention priority ranking
- supporting evidence on recommendations

## Future Integration

Safe next steps:

1. Add a repository adapter that loads evidence records for one student.
2. Feed the profile into parent/tutor dashboard summaries.
3. Use priorities to select remediation paths.
4. Add audit logs when a recommendation is shown.
5. Keep profile generation inspectable for tutor and parent trust.

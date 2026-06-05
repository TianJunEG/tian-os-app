# WordPath Knowledge Map V1

Phase 5 architecture for diagnosing problem-solving structures separately from MathPath content skills.

WordPath answers:

> What type of thinking is weak?

MathPath answers:

> What topic or computation skill is weak?

This phase is passive architecture only. It does not change production diagnostics, remediation, practice, UI, or question generation.

## Why WordPath Exists

A student can know the computation but still fail the problem structure.

Example:

- MathPath skill is secure: add fractions, subtract fractions
- WordPath weakness: fraction of remainder

In that case, more fraction computation practice is not enough. The student needs help interpreting the story structure and modelling the quantities.

## Architecture

Implemented in:

- `frontend/src/wordpath/wordStructureModel.js`
- `frontend/src/wordpath/wordPathKnowledgeMapV1.js`

Structure:

```js
{
  domain: 'wordpath',
  structures: [
    {
      id,
      title,
      modelMethod: {
        modelType,
        visualRepresentation
      },
      microSkills: [
        {
          id,
          title,
          misconceptions,
          diagnosticAssets,
          remediationAssets,
          mathPathLinks
        }
      ]
    }
  ]
}
```

## Initial Problem Structures

| Structure | Purpose | Model Method |
|---|---|---|
| Part-Whole | Total made from known or unknown parts | Part-whole bar |
| Comparison | More/fewer/greater/smaller/difference | Comparison bar |
| Before-After | Quantity changes over time | Before-after bar |
| Transfer | One group gives to another | Transfer bar with arrow |
| Repeated Quantity | Equal groups or repeated units | Repeated equal bars |
| Unit Value | Find one unit before scaling | Unit bar |
| Fraction of Quantity | Apply fraction to a whole quantity | Fraction bar |
| Fraction of Remainder | Apply later fraction to what is left | Original and remainder bars |
| Unchanged Total | Parts change but total stays fixed | Constant total bar |
| Constant Difference | Two quantities change equally | Comparison bar with fixed gap |
| Rate | Per-unit relationship | Rate table |
| Ratio Structures | Ratio units and actual quantities | Ratio bar |
| Percentage Structures | Percent base and change | Percent bar |

## Example: Fraction of Remainder

Structure:

`wordpath.fraction_of_remainder`

Model Method:

```js
{
  modelType: 'FRACTION_BAR',
  visualRepresentation: 'original bar, removed segment, then remainder bar repartitioned'
}
```

Micro-skills:

- `wordpath.fraction_remainder.identify_original_removed_remainder`
- `wordpath.fraction_remainder.distinguish_remaining_from_used`

Common misconceptions:

| Misconception | Observable Behaviour |
|---|---|
| Uses original quantity instead of remainder | Applies each fraction to the starting amount |
| Applies fraction before finding remainder | Finds later fraction before subtracting removed amount |
| Answers used amount instead of remaining amount | Reports removed quantity as final answer |

Diagnostic assets:

- recognition question
- reasoning question
- misconception detection question

Remediation assets:

- concept explanation
- worked example
- model method example
- guided practice
- independent practice
- fluency variant
- retention review

MathPath links:

- F024
- F025
- `fractions.p4.fraction_remainder_reasoning`
- `fractions.p4.model_one_step_word_problem`

## Misconception Map

Generated from the WordPath map through `buildWordMisconceptionMap`.

Shape:

```js
{
  structure,
  microSkill,
  misconception,
  observableBehaviour,
  likelyCause
}
```

This allows future systems to record:

- the problem structure
- the micro-skill weakness
- the evidence pattern
- the likely interpretation cause

## Diagnostic Asset Map

Generated through `buildWordDiagnosticAssetMap`.

Every micro-skill has:

- recognition diagnostic
- reasoning diagnostic
- misconception detection diagnostic

The questions are short. They are intended to isolate structure weakness quickly.

## Remediation Asset Map

Generated through `buildWordRemediationAssetMap`.

Every micro-skill has:

- concept explanation
- worked example
- model method example
- guided practice
- independent practice
- fluency variant
- retention review

Assets are planned references only. They are not delivered in this phase.

## Model Method Integration

WordPath explicitly stores Singapore Model Method metadata:

```js
{
  structure,
  modelType,
  visualRepresentation
}
```

Supported V1 model types:

- `PART_WHOLE`
- `COMPARISON`
- `BEFORE_AFTER`
- `TRANSFER`
- `REPEATED_QUANTITY`
- `UNIT_VALUE`
- `FRACTION_BAR`
- `RATIO_BAR`
- `RATE_TABLE`
- `PERCENT_BAR`

## Mapping To MathPath

WordPath micro-skills include `mathPathLinks`.

Examples:

| MathPath Area | WordPath Structure |
|---|---|
| Fractions | Fraction of Quantity |
| Fractions | Fraction of Remainder |
| Fractions | Part-Whole |
| Fractions | Comparison |
| Percentage | Percentage Structures |
| Ratio | Ratio Structures |
| Repeated Quantity | Unit Value / Repeated Quantity |

This lets future diagnostics distinguish:

- strong computation + weak interpretation
- weak computation + adequate interpretation
- both weak

## Validation

Tests added:

- `frontend/src/wordpath/wordStructureModel.test.js`
- `frontend/src/wordpath/wordPathKnowledgeMapV1.test.js`

Validation checks:

- WordPath is a standalone domain
- structures have model-method metadata
- every micro-skill has misconceptions
- every misconception has observable behaviour and likely cause
- every micro-skill has diagnostic assets
- every micro-skill has remediation assets
- every micro-skill links to MathPath skills or areas

## Future Integration

Do not wire this into production yet.

Safe next steps:

1. Add a resolver for `MathPath skill -> candidate WordPath structures`.
2. Use the resolver in audit/reporting only.
3. Add paper-review tagging for WordPath structures.
4. Add tutor-facing structure diagnosis.
5. Later, route remediation by both content skill and word structure.

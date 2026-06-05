# Fractions Diagnostic Coverage Audit

Phase 3 audit for the passive Fractions Diagnostic Asset Architecture.

Scope: P4 Fractions micro-skills from `FRACTIONS_KNOWLEDGE_MAP_V1` and misconception mappings from `FRACTIONS_MISCONCEPTION_MAP_V1`.

This phase does not change production diagnostics, practice, fluency, question generation, remediation delivery, or UI.

## Diagnostic Readiness Standard

A micro-skill is marked diagnostic-ready only when it has:

- 1 recognition question
- 1 procedural question
- 1 misconception detection question
- confidence indicators
- working indicators
- misconception indicators
- remediation triggers

## Coverage Table

| Micro Skill | Diagnostic Questions Count | Coverage Status | Missing Assets | Risk Level |
|---|---:|---|---|---|
| `fractions.p4.equal_parts_whole` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.numerator_denominator_meaning` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.unit_fraction_size` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.number_line_position` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.recognise_equivalence` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.generate_equivalent_fractions` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.simplify_to_lowest_terms` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.compare_same_denominator` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.compare_same_numerator` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.order_related_fractions` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.recognise_improper_fractions` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.recognise_mixed_numbers` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.convert_mixed_to_improper` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.convert_improper_to_mixed` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.add_same_denominator` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.subtract_same_denominator` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.add_related_denominators` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.subtract_related_denominators` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.unit_fraction_of_quantity` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.non_unit_fraction_of_quantity` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.fraction_remainder_reasoning` | 3 | Diagnostic Ready | None | Low |
| `fractions.p4.model_one_step_word_problem` | 3 | Diagnostic Ready | None | Low |

## Totals

- Micro-skills covered: 22
- Diagnostic questions defined: 66
- Diagnostic-ready micro-skills: 22
- Missing assets: 0
- High-risk gaps: 0

## Diagnostic Question Types

The asset architecture supports:

- `RECOGNITION`
- `PROCEDURAL`
- `APPLICATION`
- `REASONING`

Each micro-skill currently has:

- recognition question
- procedural question
- reasoning or application misconception-detection question

The questions are short by design. Their purpose is to identify understanding quickly, not to form a full assessment.

## Diagnostic Signal Rules

Reusable rules are defined in `diagnosticAssetModel.js`.

| Rule | Interpretation | Use |
|---|---|---|
| Correct + high confidence | Likely mastered | mastery evidence |
| Correct + no working declared | Possible fluency | mental fluency signal |
| Correct + working submitted | Understanding visible, fluency still building | working-supported mastery |
| Wrong + low confidence | Knowledge gap | guided review |
| Wrong + high confidence | Misconception | strong misconception signal |
| Wrong + high confidence + no working | Overconfidence risk | strong remediation trigger |
| Wrong + no working + high working requirement | Working habit review | intervention priority |

## Example: Improper to Mixed

Micro-skill:

`fractions.p4.convert_improper_to_mixed`

Diagnostic assets:

- Recognition: "For 7/3, what operation finds the number of wholes?"
- Procedural: "Convert 7/3 to a mixed number."
- Misconception detection: "A student writes 7/3 = 3 1/2. What was misunderstood?"

Misconception signals:

- `M-MIX-006`: remainder placed as denominator
- `M-MIX-007`: whole number calculated incorrectly

Working signals:

- Correct without working -> possible fluency
- Wrong without working -> possible overconfidence
- Correct with working -> understanding visible; fluency still building

## Future Hooks

Every diagnostic entry includes empty placeholders for:

- `practiceAssets`
- `fluencyAssets`
- `checkpointAssets`
- `wordPathAssets`
- `paperReviewMapping`

These are intentionally empty. They should be populated only when future phases wire diagnostics into practice, fluency, paper review, and remediation delivery.

## Implementation Files

- `frontend/src/mathpath/knowledge/diagnosticAssetModel.js`
- `frontend/src/mathpath/fractions/fractionsDiagnosticAssetMapV1.js`
- `frontend/src/mathpath/knowledge/diagnosticAssetModel.test.js`
- `frontend/src/mathpath/fractions/fractionsDiagnosticAssetMapV1.test.js`

## Recommendation

Keep the asset map passive until a later integration phase. The next safe step is a resolver that can translate:

```js
legacySkillId -> topicId -> microSkillId -> diagnosticAssetIds
```

That resolver should be used for audit/reporting first before changing live student diagnostics.

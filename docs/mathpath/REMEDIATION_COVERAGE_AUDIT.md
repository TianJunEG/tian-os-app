# Fractions Remediation Coverage Audit

Phase 4 audit for the passive Fractions Remediation Asset Architecture.

Scope: P4 Fractions micro-skills from `FRACTIONS_KNOWLEDGE_MAP_V1`, misconception mappings from `FRACTIONS_MISCONCEPTION_MAP_V1`, and diagnostic assets from `FractionsDiagnosticAssetMap`.

This phase does not create UI, deliver remediation, generate question banks, or change production routing.

## Remediation Readiness Standard

A micro-skill is marked remediation-ready only when it has planned assets for:

- Concept Explanation
- Worked Example
- Model Trainer
- Guided Practice
- Independent Practice
- Fluency Practice
- Retention Review

Each retention asset must include review days:

- Day 3
- Day 7
- Day 14
- Day 30

## Coverage Table

| Micro Skill | Concept Assets | Worked Examples | Model Trainers | Guided Practice | Independent Practice | Fluency | Retention | Coverage Status |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `fractions.p4.equal_parts_whole` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.numerator_denominator_meaning` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.unit_fraction_size` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.number_line_position` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.recognise_equivalence` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.generate_equivalent_fractions` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.simplify_to_lowest_terms` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.compare_same_denominator` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.compare_same_numerator` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.order_related_fractions` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.recognise_improper_fractions` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.recognise_mixed_numbers` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.convert_mixed_to_improper` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.convert_improper_to_mixed` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.add_same_denominator` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.subtract_same_denominator` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.add_related_denominators` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.subtract_related_denominators` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.unit_fraction_of_quantity` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.non_unit_fraction_of_quantity` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.fraction_remainder_reasoning` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |
| `fractions.p4.model_one_step_word_problem` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Remediation Ready |

## Totals

- Micro-skills covered: 22
- Concept assets planned: 22
- Worked examples planned: 22
- Model trainer assets planned: 22
- Guided practice assets planned: 22
- Independent practice assets planned: 22
- Fluency assets planned: 22
- Retention assets planned: 22
- Missing assets: 0
- High-risk gaps: 0

## Remediation Path Rules

Reusable rules are defined in `remediationAssetModel.js`.

| Rule | Trigger | Path |
|---|---|---|
| `wrong_high_confidence_misconception` | Wrong + high confidence + misconception detected | Concept Explanation -> Worked Example -> Model Trainer -> Guided Practice -> Independent Practice |
| `wrong_low_confidence` | Wrong + low confidence | Concept Explanation -> Worked Example -> Guided Practice |
| `correct_slow` | Correct + slow | Fluency Practice -> Retention Review |
| `correct_fast` | Correct + fast | Retention Review |

## Example: Improper Fraction to Mixed Number

Micro-skill:

`fractions.p4.convert_improper_to_mixed`

Mapped misconceptions:

- `M-MIX-006`: Remainder placed as denominator
- `M-MIX-007`: Whole number calculated incorrectly

Recommended misconception path:

1. Concept Explanation
2. Worked Example
3. Model Trainer
4. Guided Practice
5. Independent Practice

Retention schedule:

- Day 3
- Day 7
- Day 14
- Day 30

## Future Hooks

Every remediation entry includes empty placeholders for:

- `paperReviewMapping`
- `tutorInterventionMapping`
- `parentRecommendations`
- `teacherGrouping`
- `aiCoaching`

These hooks are intentionally empty. They should be populated only when future phases wire remediation assets into paper review, tutor intelligence, parent guidance, teacher grouping, and AI coaching.

## Implementation Files

- `frontend/src/mathpath/knowledge/remediationAssetModel.js`
- `frontend/src/mathpath/fractions/fractionsRemediationAssetMapV1.js`
- `frontend/src/mathpath/knowledge/remediationAssetModel.test.js`
- `frontend/src/mathpath/fractions/fractionsRemediationAssetMapV1.test.js`

## Recommendation

Keep this architecture passive until a later delivery phase. The next safe integration is a resolver that can return:

```js
{
  microSkillId,
  misconceptionId,
  recommendedPathRule,
  assetSequence
}
```

Use the resolver for audit/reporting first before changing live remediation or student practice.

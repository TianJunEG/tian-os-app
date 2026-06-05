# Fractions Misconception and Remediation Map V1

Phase 2 intelligence layer for Tian OS Fractions.

Scope: P4 Fractions micro-skills from `FRACTIONS_KNOWLEDGE_MAP_V1`.

This phase does not generate questions, select remediation, or change production learning behaviour. It defines the map between observed mistakes and recommended intervention types.

## Purpose

The misconception map answers:

- Why is the student struggling?
- What evidence would show this misconception?
- What is the likely cause?
- What kind of intervention should be recommended next?

This sits between mistake detection and intervention delivery.

## Reusable Structure

Implemented in:

- `frontend/src/mathpath/knowledge/remediationMapModel.js`
- `frontend/src/mathpath/fractions/fractionsRemediationMapV1.js`

Shape:

```js
{
  domain,
  topic,
  microSkill,
  misconceptions: [
    {
      id,
      title,
      description,
      observableBehaviours,
      likelyCauses,
      interventions
    }
  ],
  observableBehaviours,
  likelyCauses,
  interventions
}
```

Supported intervention types:

- `CONCEPT_REVIEW`
- `GUIDED_EXAMPLE`
- `MODEL_TRAINER`
- `TARGETED_PRACTICE`
- `FLUENCY`

These are recommendation categories only. They do not launch remediation yet.

## Coverage

The map covers every P4 micro-skill from the Fractions Knowledge Map V1:

- Understanding Fractions
- Equivalent Fractions and Simplest Form
- Comparing and Ordering Fractions
- Improper Fractions and Mixed Numbers
- Fraction Operations
- Fraction of Quantity and Problem Solving

Every micro-skill has:

- Common misconceptions
- Observable behaviours
- Likely causes
- Recommended intervention categories

Every misconception has its own observable evidence and intervention recommendation.

## Example: Convert Improper Fractions to Mixed Numbers

Micro-skill:

`fractions.p4.convert_improper_to_mixed`

Mapped misconceptions:

| Misconception | Observable Behaviours | Likely Causes | Interventions |
|---|---|---|---|
| Remainder placed as denominator | `7/3 = 2 3/1`; `9/4 = 2 4/1` | Confuses quotient, divisor, and remainder positions; does not preserve original denominator | Guided Example, Model Trainer, Targeted Practice |
| Whole number calculated incorrectly | `7/3 = 3 1/2`; `7/3 = 7 3` | Does not understand whole groups of denominator size; quotient-remainder reasoning is weak | Concept Review, Guided Example, Fluency |

## Example: Fraction of the Remainder

Micro-skill:

`fractions.p4.fraction_remainder_reasoning`

Mapped misconceptions:

| Misconception | Observable Behaviours | Likely Causes | Interventions |
|---|---|---|---|
| Uses original whole for every fraction | Finds `1/3 of 42` after already removing `1/2 of 42`; ignores “of the remaining” | Does not update the whole after each step; remainder language is not connected to subtraction | Concept Review, Model Trainer, Targeted Practice |
| Loses track of remaining quantity | Finds used amounts correctly but reports total used when asked for left | Question target is not tracked; working layout does not label intermediate quantities | Guided Example, Targeted Practice |

## How Future Systems Should Use This

### Diagnostics

Diagnostics can emit:

```js
{
  microSkillId,
  misconceptionId,
  evidenceSource: 'answer_pattern'
}
```

### Working Intelligence

Working analysis can emit:

```js
{
  microSkillId,
  misconceptionId,
  evidenceSource: 'working_steps',
  observableBehaviour: '1/2 + 1/3 = 2/5'
}
```

### Mistake Review

Student-facing copy should translate technical labels into supportive explanations:

- Technical: `M-OPS-003`
- Student: "You may have added the denominators directly. Try renaming the fractions so the parts are the same size first."

### Parent Insights

Parent-facing copy should group by topic and avoid labels:

"Your child is finding fraction word problems harder when the second fraction applies to what is left. Encourage them to write the remaining amount after each step."

### Tutor Intelligence

Tutor-facing views can expose:

- micro-skill
- misconception
- observable evidence
- likely cause
- recommended intervention type

## Compatibility Rules

- Do not remove or rename Phase 1 micro-skill IDs.
- Do not replace existing `misconceptionTags` yet.
- Keep F001-F026 compatibility through the knowledge map.
- Do not auto-select remediation from this map until a later integration phase.
- Treat this map as metadata until wired into diagnostics/remediation.

## Validation

Tests added:

- `frontend/src/mathpath/knowledge/remediationMapModel.test.js`
- `frontend/src/mathpath/fractions/fractionsRemediationMapV1.test.js`

Validation checks:

- every micro-skill has a remediation entry
- every Phase 1 misconception ID is mapped
- every misconception has observable evidence
- every misconception has likely causes
- every misconception has intervention recommendations
- improper-to-mixed conversion has explicit evidence patterns

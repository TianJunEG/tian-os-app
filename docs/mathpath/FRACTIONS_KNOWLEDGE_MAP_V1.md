# Fractions Knowledge Map V1

Phase 1 foundational architecture for Tian OS Fractions.

Scope: P4 Fractions only. This document and the matching data model do not change production question selection, practice routing, diagnostics, fluency, or remediation behavior yet.

## Purpose

The knowledge map becomes the curriculum intelligence layer for future:

- Diagnostics
- Practice
- Fluency
- Remediation
- Paper Review
- Tutor Intelligence
- Parent Insights
- AI-generated questions

The current F001-F026 sequence remains as backward-compatible legacy IDs. Future systems should target micro-skills.

## Reusable Model

Implemented in:

- `frontend/src/mathpath/knowledge/knowledgeMapModel.js`
- `frontend/src/mathpath/fractions/fractionsKnowledgeMapV1.js`

Core shape:

```js
{
  domain,
  domainTitle,
  stage,
  modelVersion,
  topics: [
    {
      id,
      title,
      description,
      legacySkillIds,
      microSkills: [
        {
          id,
          title,
          legacySkillIds,
          prerequisites,
          learningObjectives,
          misconceptions,
          diagnosticAssets,
          practiceAssets,
          fluencyAssets,
          wordPathAssets,
          modelTrainerAssets,
          remediationAssets
        }
      ]
    }
  ]
}
```

The same model can be reused for decimals, percentage, ratio, geometry, and later P5/P6 maps.

## P4 Topic Hierarchy

### 1. Understanding Fractions

Legacy coverage: F001, F002, F003, F004, F005

Micro-skills:

- `fractions.p4.equal_parts_whole`
- `fractions.p4.numerator_denominator_meaning`
- `fractions.p4.unit_fraction_size`
- `fractions.p4.number_line_position`

### 2. Equivalent Fractions and Simplest Form

Legacy coverage: F010, F011, F012

Micro-skills:

- `fractions.p4.recognise_equivalence`
- `fractions.p4.generate_equivalent_fractions`
- `fractions.p4.simplify_to_lowest_terms`

### 3. Comparing and Ordering Fractions

Legacy coverage: F006, F007, F008, F009

Micro-skills:

- `fractions.p4.compare_same_denominator`
- `fractions.p4.compare_same_numerator`
- `fractions.p4.order_related_fractions`

### 4. Improper Fractions and Mixed Numbers

Legacy coverage: F013, F014, F015

Micro-skills:

- `fractions.p4.recognise_improper_fractions`
- `fractions.p4.recognise_mixed_numbers`
- `fractions.p4.convert_mixed_to_improper`
- `fractions.p4.convert_improper_to_mixed`

### 5. Fraction Operations

Legacy coverage: F016, F017, F018, F019

Micro-skills:

- `fractions.p4.add_same_denominator`
- `fractions.p4.subtract_same_denominator`
- `fractions.p4.add_related_denominators`
- `fractions.p4.subtract_related_denominators`

F021 and F022 remain deferred P5/P6 operation references.

### 6. Fraction of Quantity and Problem Solving

Legacy coverage: F020, F023, F024, F025

Micro-skills:

- `fractions.p4.unit_fraction_of_quantity`
- `fractions.p4.non_unit_fraction_of_quantity`
- `fractions.p4.fraction_remainder_reasoning`
- `fractions.p4.model_one_step_word_problem`

F026 remains deferred until mastery/capstone maps are rebuilt after P5/P6 coverage exists.

## Misconception Mapping

Each micro-skill includes structured misconception metadata:

```js
{
  id,
  title,
  description
}
```

Examples:

- `M-FND-003`: swaps numerator and denominator
- `M-EQ-002`: scales only numerator or only denominator
- `M-MIX-006`: places remainder as denominator
- `M-OPS-003`: adds unlike fractions without renaming
- `M-QTY-004`: applies every fraction to the original whole instead of the remainder

These are metadata only in Phase 1. They do not trigger remediation yet.

## Future Asset Hooks

Every micro-skill has empty arrays for:

- `diagnosticAssets`
- `practiceAssets`
- `fluencyAssets`
- `wordPathAssets`
- `modelTrainerAssets`
- `remediationAssets`

These are intentionally empty placeholders. Later phases should attach assets by micro-skill ID rather than by broad F-code.

## Migration Recommendations

### Phase 1: Passive Architecture

Done in this phase:

- Add reusable knowledge map model.
- Add P4 Fractions knowledge map.
- Add docs and tests.
- Preserve F001-F026 behavior.

No production selector should import the map yet.

### Phase 2: Resolver Layer

Add a resolver:

```js
legacySkillId -> topicId -> candidateMicroSkillIds
```

Use it for analytics and reporting first. Do not change student routing until verified.

### Phase 3: Diagnostic Emission

Diagnostics should emit:

```js
{
  legacySkillId,
  topicId,
  microSkillId,
  misconceptionId
}
```

Existing consumers can keep using `legacySkillId` while newer systems consume micro-skill metadata.

### Phase 4: Practice and Remediation

Practice selection can move from broad skill routing to:

- micro-skill readiness
- prerequisite gap
- misconception evidence
- working evidence

Remediation should select assets by `microSkillId` and `misconceptionId`.

### Phase 5: Parent/Tutor Intelligence

Parent language should group micro-skills into topics.

Tutor language can expose:

- exact micro-skill
- misconception
- evidence source
- recommended intervention

## Compatibility Rules

- Do not remove F001-F026.
- Do not rewrite historical attempts in Phase 1.
- Do not attach generated questions directly to this map yet.
- Do not create P5/P6 maps until P4 is validated.
- Keep micro-skill IDs stable once production systems consume them.

## Validation

Tests added:

- `frontend/src/mathpath/knowledge/knowledgeMapModel.test.js`
- `frontend/src/mathpath/fractions/fractionsKnowledgeMapV1.test.js`

Validation checks:

- domain/topic/micro-skill model is structurally valid
- legacy F-code mappings exist for P4-audited skills
- every micro-skill has learning objectives
- every micro-skill has misconception metadata
- every future asset hook exists and is empty

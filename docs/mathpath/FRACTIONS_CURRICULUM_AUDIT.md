# Fractions Curriculum Audit

Date: 2026-06-04

Scope: MathPath Fractions `F001`-`F026` only. This is an audit document. No production skill data, seed data, question generators, routes, or dashboard logic were changed.

## Executive Summary

The current Fractions vertical has **26 canonical skills**. They are stable and useful as a pilot reporting spine, but they are not all teachable micro-skills.

Verdict:

- **Micro-skill:** 7 current skills
- **Lesson-level skill:** 11 current skills
- **Topic-level objective:** 8 current skills

The broadest skills are `F009`, `F018`, `F019`, `F020`, `F023`, `F024`, `F025`, and `F026`. These should eventually become topic or milestone nodes containing smaller instructional skills.

Recommended next structure:

```text
Domain
→ Topic / Stage
→ Teachable Skill
→ Question Families / Questions
```

Recommended Fractions progression:

```text
Fractions
→ Fractions I: Meaning and Models
→ Fractions II: Comparison and Equivalence
→ Fractions III: Mixed Numbers and Conversion
→ Fractions IV: Operations
→ Fractions V: Fraction of Quantity and Models
→ Fractions VI: Word Problems and Heuristics
→ Fractions VII: Exam Applications and Mastery
```

Estimated future skill count:

- Current: **26**
- MVP micro-skill version: **64-72**
- Full diagnostic/remediation version: **80-95**

Recommendation: keep `F001`-`F026` as **strand milestones / reporting anchors** for now, and introduce child micro-skills under them before expanding content generation further.

## Current Sources Reviewed

- `scripts/domains/fractions.js`
- `frontend/src/mathpath/fractions/fractionSkillGraph.js`
- `docs/mathpath/Fractions_F001_to_Current_Slug_Mapping.md`
- `docs/mathpath/MathPath_Master_Working_Document_v1.3.md`
- `docs/mathpath/Fractions_Content_Coverage_Report.md`
- `docs/mathpath/Fractions_Question_Quality_Audit.md`

## Current Skill Count

Current canonical skills: **26**

| ID | Current skill | Strand | Level | Current classification | Audit note |
|---|---|---|---|---|---|
| F001 | Recognise Fractions | Foundations | P2 | Lesson-level skill | Broad if it includes shaded shapes, sets, bars, and equal-parts reasoning. |
| F002 | Numerator and Denominator | Foundations | P2 | Micro-skill | Mostly vocabulary plus role interpretation. |
| F003 | Fraction of a Whole | Foundations | P2/P3 | Lesson-level skill | Should split into equal parts, shaded part, unshaded part, and whole identification. |
| F004 | Unit Fractions | Foundations | P2/P3 | Micro-skill | Reasonably focused. |
| F005 | Fractions on Number Line | Representation | P3/P4 | Lesson-level skill | Contains partitioning, locating, reading, and interval reasoning. |
| F006 | Compare Unit Fractions | Comparison | P3/P4 | Micro-skill | Focused denominator-size reasoning. |
| F007 | Compare Same Denominator | Comparison | P3/P4 | Micro-skill | Focused numerator comparison. |
| F008 | Compare Same Numerator | Comparison | P4 | Micro-skill | Focused denominator comparison. |
| F009 | Order Fractions | Comparison | P4/P5 | Topic-level objective | Ordering depends on same denominator, same numerator, benchmarks, equivalence, and mixed sets. |
| F010 | Equivalent Fractions | Equivalence | P3/P4 | Lesson-level skill | Should split recognition by model, number line, and symbolic equivalence. |
| F011 | Generate Equivalent Fractions | Equivalence | P4/P5 | Lesson-level skill | Multiplication and division scaling are separate teachable steps. |
| F012 | Simplify Fractions | Equivalence | P4/P5 | Lesson-level skill | Needs common factor, HCF, and lowest-term checks. |
| F013 | Improper Fractions | Conversion | P4 | Lesson-level skill | Includes interpretation, visual models, and symbolic reading. |
| F014 | Mixed Numbers | Conversion | P4/P5 | Lesson-level skill | Includes whole-number part, fraction part, and visual representation. |
| F015 | Convert Mixed ↔ Improper | Conversion | P4/P5 | Topic-level objective | Two inverse procedures plus model interpretation. |
| F016 | Add Same Denominator | Operations | P3/P4 | Micro-skill | Focused operation; may still split into proper, improper, mixed result. |
| F017 | Subtract Same Denominator | Operations | P3/P4 | Micro-skill | Focused operation; may split no-regroup vs regroup later. |
| F018 | Add Different Denominators | Operations | P5 | Topic-level objective | Contains finding common denominator, equivalent conversion, adding, simplifying, and mixed-number cases. |
| F019 | Subtract Different Denominators | Operations | P5 | Topic-level objective | Contains common denominator, regrouping, simplifying, and mixed-number cases. |
| F020 | Fraction of Quantity | Applications | P4/P5 | Topic-level objective | Discrete/continuous quantities, unit-first, remainder, countability, and units are separate. |
| F021 | Multiply Fractions | Operations | P6 | Lesson-level skill | Should split whole-number multiplier, fraction × whole, fraction × fraction, simplify-before/after. |
| F022 | Divide Fractions | Operations | P6 | Lesson-level skill | Should split unit fraction divisor, reciprocal model, and fraction ÷ fraction. |
| F023 | Fraction Word Problems | Applications | P5/P6 | Topic-level objective | Too broad; should split by schema: part-whole, remainder, comparison, before-after, fraction of set. |
| F024 | Multi-Step Fraction Problems | Applications | P6 | Topic-level objective | Too broad; should split sequence, remainder-of-remainder, work backwards, branching/tree method. |
| F025 | Exam-Style Fraction Applications | Assessment Prep | P6 | Topic-level objective | Assessment container rather than a teachable skill. |
| F026 | Fractions Mastery Challenge | Mastery | P6 | Topic-level objective | Capstone/milestone, not a teachable skill. |

## Proposed Topic Grouping

### Fractions I: Meaning and Models

Purpose: build stable meaning of a fraction before symbolic manipulation.

Current anchors: `F001`, `F002`, `F003`, `F004`, `F005`

Proposed micro-skills:

| Proposed ID | Micro-skill | Parent anchor | Prerequisites |
|---|---|---|---|
| FR1.01 | Identify equal and unequal parts | F001 | whole-number counting |
| FR1.02 | Identify shaded fraction from a shape | F001 | FR1.01 |
| FR1.03 | Identify unshaded fraction from a shape | F001 | FR1.02 |
| FR1.04 | Identify fraction from a set | F001/F003 | FR1.02 |
| FR1.05 | Identify the whole in a fraction model | F003 | FR1.01 |
| FR1.06 | Match fraction notation to model | F001/F002 | FR1.02, FR1.05 |
| FR1.07 | Explain numerator as selected parts | F002 | FR1.02 |
| FR1.08 | Explain denominator as equal parts in the whole | F002 | FR1.01 |
| FR1.09 | Identify unit fractions in models | F004 | FR1.07, FR1.08 |
| FR1.10 | Read fractions on a 0-to-1 number line | F005 | FR1.05 |
| FR1.11 | Locate a fraction on a number line | F005 | FR1.10 |
| FR1.12 | Interpret fractions beyond 1 on a number line | F005/F013 | FR1.10 |

### Fractions II: Comparison, Ordering, and Equivalence

Purpose: develop size reasoning before operations.

Current anchors: `F006`, `F007`, `F008`, `F009`, `F010`, `F011`, `F012`

Proposed micro-skills:

| Proposed ID | Micro-skill | Parent anchor | Prerequisites |
|---|---|---|---|
| FR2.01 | Compare unit fractions using denominator size | F006 | FR1.09 |
| FR2.02 | Compare same-denominator fractions | F007 | FR1.07, FR1.08 |
| FR2.03 | Compare same-numerator fractions | F008 | FR2.01 |
| FR2.04 | Compare using benchmark 1/2 | F009 | FR2.01-FR2.03 |
| FR2.05 | Order same-denominator fractions | F009 | FR2.02 |
| FR2.06 | Order same-numerator fractions | F009 | FR2.03 |
| FR2.07 | Order mixed fractions using benchmarks | F009 | FR2.04 |
| FR2.08 | Recognise equivalent fractions in models | F010 | FR1.06 |
| FR2.09 | Recognise equivalent fractions symbolically | F010 | multiplication facts |
| FR2.10 | Generate equivalent fractions by multiplying | F011 | FR2.09 |
| FR2.11 | Generate equivalent fractions by dividing | F011 | FR2.09, division facts |
| FR2.12 | Find missing numerator or denominator in equivalent fractions | F011 | FR2.10, FR2.11 |
| FR2.13 | Simplify using a common factor | F012 | FR2.11 |
| FR2.14 | Simplify to lowest terms using HCF | F012 | FR2.13 |
| FR2.15 | Check whether a fraction is in simplest form | F012 | FR2.14 |

### Fractions III: Improper Fractions, Mixed Numbers, and Conversion

Purpose: connect models, division, and notation around quantities greater than 1.

Current anchors: `F013`, `F014`, `F015`

Proposed micro-skills:

| Proposed ID | Micro-skill | Parent anchor | Prerequisites |
|---|---|---|---|
| FR3.01 | Interpret improper fractions as more than one whole | F013 | FR1.05 |
| FR3.02 | Represent improper fractions with models | F013 | FR3.01 |
| FR3.03 | Interpret mixed numbers as whole plus fraction | F014 | FR1.05 |
| FR3.04 | Represent mixed numbers with models | F014 | FR3.03 |
| FR3.05 | Convert improper fraction to mixed number using division | F015 | FR3.01 |
| FR3.06 | Convert mixed number to improper fraction | F015 | FR3.03 |
| FR3.07 | Compare mixed numbers and improper fractions | F015/F009 | FR3.05, FR3.06 |
| FR3.08 | Place mixed numbers and improper fractions on a number line | F005/F015 | FR1.12, FR3.05 |

### Fractions IV: Operations

Purpose: build operation fluency with clear denominator reasoning and simplification.

Current anchors: `F016`, `F017`, `F018`, `F019`, `F021`, `F022`

Proposed micro-skills:

| Proposed ID | Micro-skill | Parent anchor | Prerequisites |
|---|---|---|---|
| FR4.01 | Add same-denominator proper fractions | F016 | FR2.02 |
| FR4.02 | Add same-denominator fractions with improper result | F016/F013 | FR4.01, FR3.01 |
| FR4.03 | Subtract same-denominator proper fractions | F017 | FR2.02 |
| FR4.04 | Subtract same-denominator fractions from 1 whole | F017 | FR3.03 |
| FR4.05 | Find a common denominator for two fractions | F018/F019 | FR2.10 |
| FR4.06 | Add unlike proper fractions | F018 | FR4.05 |
| FR4.07 | Add unlike fractions and simplify | F018/F012 | FR4.06 |
| FR4.08 | Add mixed numbers | F018/F015 | FR3.06, FR4.06 |
| FR4.09 | Subtract unlike proper fractions | F019 | FR4.05 |
| FR4.10 | Subtract unlike fractions requiring regrouping | F019/F015 | FR4.09, FR3.06 |
| FR4.11 | Subtract mixed numbers | F019/F015 | FR4.10 |
| FR4.12 | Multiply a fraction by a whole number | F021 | F020 |
| FR4.13 | Multiply a whole number by a fraction | F021 | FR4.12 |
| FR4.14 | Multiply a fraction by a fraction | F021 | FR2.14 |
| FR4.15 | Simplify before or after multiplication | F021/F012 | FR4.14 |
| FR4.16 | Divide a whole number by a unit fraction | F022 | FR4.12 |
| FR4.17 | Divide a fraction by a whole number | F022 | FR4.14 |
| FR4.18 | Divide by a fraction using reciprocal | F022 | FR4.14 |

### Fractions V: Fraction of Quantity and Model Drawing

Purpose: support applied fraction reasoning before word-problem complexity.

Current anchors: `F020`, part of `F023`, Model Drawing Trainer

Proposed micro-skills:

| Proposed ID | Micro-skill | Parent anchor | Prerequisites |
|---|---|---|---|
| FR5.01 | Find unit fraction of a countable quantity | F020 | division facts |
| FR5.02 | Find non-unit fraction of a countable quantity | F020 | FR5.01 |
| FR5.03 | Find fraction of a continuous quantity | F020 | FR5.01 |
| FR5.04 | Check countability constraints in word problems | F020/F023 | FR5.02 |
| FR5.05 | Draw a part-whole bar model | F023 | FR1.05 |
| FR5.06 | Draw a remainder bar model | F023/F024 | FR5.05 |
| FR5.07 | Subdivide a remainder in a bar model | F024 | FR5.06 |
| FR5.08 | Use branching/tree method for fraction-of-remainder problems | F024 | FR5.06 |

### Fractions VI: Word Problems and Heuristics

Purpose: separate arithmetic skill from problem comprehension and schema recognition.

Current anchors: `F023`, `F024`

Proposed micro-skills:

| Proposed ID | Micro-skill | Parent anchor | Prerequisites |
|---|---|---|---|
| FR6.01 | Identify what the question asks for | F023 | reading comprehension |
| FR6.02 | Identify the whole, part, and remainder | F023 | FR5.05 |
| FR6.03 | Solve one-step part-whole fraction word problems | F023 | FR5.02 |
| FR6.04 | Solve one-step fraction-of-quantity word problems | F023 | FR5.02 |
| FR6.05 | Solve remainder-after-giving-away problems | F023 | FR5.06 |
| FR6.06 | Solve comparison fraction word problems | F023 | FR2.04 |
| FR6.07 | Choose the correct operation in a word problem | F023 | FR4 operations |
| FR6.08 | Solve two-step fraction sequence problems | F024 | FR6.03-FR6.07 |
| FR6.09 | Solve fraction-of-remainder problems | F024 | FR5.07 |
| FR6.10 | Solve work-backwards fraction problems | F024 | FR6.08 |
| FR6.11 | Solve before-after fraction problems | F024 | FR6.10 |
| FR6.12 | Check whether final answer matches the question | F023/F024 | FR6.01 |

### Fractions VII: Exam Applications and Mastery

Purpose: consolidate, mix formats, and prepare for assessment without hiding missing subskills.

Current anchors: `F025`, `F026`

Proposed micro-skills / milestone nodes:

| Proposed ID | Micro-skill or milestone | Parent anchor | Prerequisites |
|---|---|---|---|
| FR7.01 | Mixed-format fraction skill check | F025 | FR1-FR6 |
| FR7.02 | Exam-style one-mark fraction items | F025 | FR1-FR4 |
| FR7.03 | Exam-style two-mark fraction items | F025 | FR4-FR6 |
| FR7.04 | Method-mark fraction working | F025 | Working Evidence |
| FR7.05 | Multi-topic fraction problem solving | F025 | FR6.08-FR6.12 |
| FR7.06 | Fractions mastery checkpoint | F026 | FR7.01-FR7.05 |
| FR7.07 | Fractions remediation retest | F026 | weak micro-skills |

## Current Skill-by-Skill Split Recommendation

| Current ID | Keep as-is? | Recommended future role | Suggested child count |
|---|---:|---|---:|
| F001 | No | Topic/lesson anchor: recognising fractions from models | 4 |
| F002 | Mostly | Micro-skill or two child skills: numerator vs denominator | 2 |
| F003 | No | Lesson anchor: fraction of whole and whole identification | 3 |
| F004 | Mostly | Micro-skill: unit fractions | 1-2 |
| F005 | No | Lesson anchor: number-line representation | 3 |
| F006 | Yes | Micro-skill: compare unit fractions | 1 |
| F007 | Yes | Micro-skill: compare same denominator | 1 |
| F008 | Yes | Micro-skill: compare same numerator | 1 |
| F009 | No | Topic anchor: ordering strategies | 4 |
| F010 | No | Lesson anchor: recognising equivalence | 2 |
| F011 | No | Lesson anchor: generating equivalence | 3 |
| F012 | No | Lesson anchor: simplification | 3 |
| F013 | No | Lesson anchor: improper fractions | 2 |
| F014 | No | Lesson anchor: mixed numbers | 2 |
| F015 | No | Topic anchor: two-way conversion | 4 |
| F016 | Mostly | Micro/lesson skill: same-denominator addition | 2 |
| F017 | Mostly | Micro/lesson skill: same-denominator subtraction | 2 |
| F018 | No | Topic anchor: unlike-denominator addition | 4 |
| F019 | No | Topic anchor: unlike-denominator subtraction | 4 |
| F020 | No | Topic anchor: fraction of quantity | 4 |
| F021 | No | Lesson anchor: multiplication | 4 |
| F022 | No | Lesson anchor: division | 3 |
| F023 | No | Topic anchor: one-step word problem schemas | 7 |
| F024 | No | Topic anchor: multi-step word problem schemas | 5 |
| F025 | No | Assessment-prep milestone | 5 |
| F026 | No | Mastery/capstone milestone | 2 |

Estimated child micro-skills from this plan: **70-76**.

## Progression Map

```text
FR1 Meaning and Models
  FR1.01 equal parts
    → FR1.02 shaded fraction
    → FR1.03 unshaded fraction
    → FR1.05 identify whole
    → FR1.06 notation-model match
  FR1.07 numerator meaning
  FR1.08 denominator meaning
    → FR1.09 unit fractions
  FR1.10 number line 0-1
    → FR1.11 locate on number line
    → FR1.12 beyond 1

FR2 Comparison and Equivalence
  FR1.09 → FR2.01 compare unit fractions
  FR1.07/FR1.08 → FR2.02 compare same denominator
  FR2.01 → FR2.03 compare same numerator
  FR2.01-FR2.03 → FR2.04 benchmark comparison
  FR2.02-FR2.04 → FR2.05-FR2.07 ordering
  FR1.06 → FR2.08 model equivalence
  multiplication/division facts → FR2.09-FR2.12 symbolic equivalence
  FR2.11 → FR2.13-FR2.15 simplification

FR3 Mixed and Improper
  FR1.05 → FR3.01 improper meaning
  FR3.01 → FR3.02 improper models
  FR1.05 → FR3.03 mixed number meaning
  FR3.03 → FR3.04 mixed models
  FR3.01/FR3.03 → FR3.05-FR3.08 conversion and placement

FR4 Operations
  FR2.02 → FR4.01-FR4.04 same-denominator operations
  FR2.10/FR2.14 → FR4.05 common denominator
  FR4.05 → FR4.06-FR4.11 unlike-denominator operations
  FR5.01-FR5.02 → FR4.12-FR4.15 multiplication
  FR4.14 → FR4.16-FR4.18 division

FR5 Quantity and Models
  division facts → FR5.01 unit fraction of quantity
  FR5.01 → FR5.02 non-unit fraction of quantity
  FR5.02 → FR5.03 continuous quantities
  FR5.02 → FR5.04 countability constraints
  FR1.05 → FR5.05 part-whole bar model
  FR5.05 → FR5.06 remainder model
  FR5.06 → FR5.07 remainder subdivision
  FR5.06 → FR5.08 branching/tree method

FR6 Word Problems
  reading comprehension → FR6.01 identify target
  FR5.05/FR5.06 → FR6.02 whole-part-remainder
  FR5.02/FR4 operations → FR6.03-FR6.07 one-step schemas
  FR6.03-FR6.07 → FR6.08 two-step sequence
  FR5.07 → FR6.09 fraction of remainder
  FR6.08 → FR6.10 work backwards
  FR6.10 → FR6.11 before-after
  FR6.01 → FR6.12 final answer sense-check

FR7 Exam and Mastery
  FR1-FR6 → FR7.01-FR7.05 exam applications
  FR7.01-FR7.05 → FR7.06 mastery checkpoint
  weak micro-skills → FR7.07 remediation retest
```

## Domain → Topic → Skill → Question Hierarchy

Recommended production shape later:

```json
{
  "domainId": "fractions",
  "topics": [
    {
      "topicId": "fractions_i_meaning_models",
      "title": "Fractions I: Meaning and Models",
      "parentMilestoneIds": ["F001", "F002", "F003", "F004", "F005"],
      "skills": [
        {
          "skillId": "FR1.02",
          "title": "Identify shaded fraction from a shape",
          "parentFrameworkSkillId": "F001",
          "prerequisiteSkillIds": ["FR1.01"],
          "questionFamilyIds": ["QF_FR1_02_SHAPE_SHADED"]
        }
      ]
    }
  ]
}
```

The existing `F001`-`F026` IDs should remain as:

- framework milestone IDs
- dashboard/reporting anchors
- diagnostic initial-routing anchors
- compatibility layer for existing content

The proposed `FRx.xx` skills should become:

- teachable units
- remediation targets
- mastery checkpoints
- generator targets
- worksheet sections

## Prerequisite Relationship Findings

The existing graph is directionally sound:

- Foundation flows into comparison and equivalence.
- Equivalence flows into unlike-denominator operations.
- Operations and quantity flow into word problems.
- Word problems flow into exam applications and mastery.

Main gaps:

1. `F009 Order Fractions` depends on `F006`, `F007`, `F008`, but should also depend on equivalence/benchmark reasoning for mixed denominator ordering.
2. `F016 Add Same Denominator` currently depends on `F010 Equivalent Fractions`; for early primary, same-denominator addition can be taught before symbolic equivalence if model-based.
3. `F020 Fraction of Quantity` depends on `F016`, but the first teachable micro-skill should depend more directly on division facts and unit-fraction reasoning.
4. `F023` and `F024` currently depend on operation skills but do not expose problem schema prerequisites such as whole identification, remainder reasoning, model drawing, or target-question identification.
5. `F025` and `F026` are not instruction units; they are assessment/milestone containers.

## Product Implications

### Diagnostic

The adaptive diagnostic should eventually test child micro-skills, not only the current 26 anchors.

Example:

```text
Student misses F024-style fraction-of-remainder problem
→ do not only mark F024 weak
→ identify whether failure came from:
  - FR6.01 target identification
  - FR6.02 whole/part/remainder
  - FR5.07 remainder subdivision
  - FR6.10 work backwards
  - FR4.06 unlike denominator addition
```

### Mistake-to-Mastery

Current mistake tags can map to better remediation if micro-skills exist.

Example:

| Mistake tag | Better remediation target |
|---|---|
| confused_part_with_whole | FR6.02 |
| wrong_remaining_fraction | FR5.06 / FR6.05 |
| did_not_work_backwards | FR6.10 |
| denominator_added | FR4.05 / FR4.06 |
| final_answer_does_not_match_question | FR6.01 / FR6.12 |

### Story Mode

Story Mode should primarily live under `FR6` and `FR5`, not as a separate learning product.

Relevant micro-skills:

- FR6.01 identify target
- FR6.02 identify whole/part/remainder
- FR5.05 draw part-whole model
- FR5.06 draw remainder model
- FR5.07 subdivide remainder
- FR5.08 branching/tree method
- FR6.10 work backwards
- FR6.12 sense-check final answer

### Worksheets

Worksheets should be assembled by micro-skill clusters, not only current F-codes.

Example worksheet sections:

```text
Section A: Identify whole and parts
Section B: Find fraction of quantity
Section C: Remainder model problems
Section D: Work backwards
Section E: Mixed review
```

## Migration Recommendation

Do not replace `F001`-`F026` immediately.

Recommended phases:

1. **Audit phase:** keep this document as planning reference.
2. **Metadata phase:** add optional `childSkillIds` / `parentFrameworkSkillId` metadata while preserving current F-codes.
3. **Content tagging phase:** tag existing question families with proposed micro-skill IDs.
4. **Diagnostic phase:** allow diagnostic decisions to target child micro-skills while reporting up to F-codes.
5. **Remediation phase:** route Mistake-to-Mastery to micro-skill practice.
6. **Dashboard phase:** show parent/tutor high-level F-code progress but keep micro-skill detail expandable.

## Final Recommendation

The current 26-skill structure is acceptable for pilot reporting, but it is too coarse for the long-term Tian OS remediation model.

For pilot:

- Keep `F001`-`F026`.
- Do not migrate production data yet.
- Use the 26 skills as visible progress anchors.

For next curriculum build:

- Introduce **70-76 micro-skills** under the existing F-code anchors.
- Start with the highest-value splits:
  1. `F023` one-step word problem schemas
  2. `F024` multi-step/remainder/work-backwards schemas
  3. `F020` fraction of quantity
  4. `F018`/`F019` unlike-denominator operation steps
  5. `F001`/`F003` model interpretation details

This gives MathPath a stronger remediation structure without breaking current pilot readiness.

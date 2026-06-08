# Fractions Runtime Crosswalk Audit

Date: 2026-06-08

Scope: Tian OS MathPath Fractions runtime and documentation crosswalk between the current canonical runtime anchors `F001`-`F026` and the proposed micro-skill taxonomy `FR1`-`FR7`.

This is a documentation-only audit. No runtime code, production seed data, question generators, routes, or dashboard logic were modified as part of this audit.

## Purpose

- Document how the current runtime skill graph is structured today.
- Crosswalk the existing runtime anchors `F001`-`F026` to the proposed seven-stage micro-skill progression.
- Identify where runtime anchors are broad lesson/topic objectives rather than teachable micro-skills.
- Recommend an implementation path that preserves `F001`-`F026` as stable reporting anchors while introducing finer-grained micro-skill diagnostics and remediation.

## Runtime sources reviewed

- `frontend/src/mathpath/fractions/fractionSkillGraph.js`
- `frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js`
- `frontend/src/mathpath/curriculum/fractionCurriculumMappings.js`
- `frontend/src/mathpath/curriculum/fractionUniversalSkills.js`
- `frontend/src/mathpath/fractions/fractionQuestionFamilies.js`

## Current runtime skill structure

The runtime currently defines a canonical Fractions skill set of 26 anchor skills. These are the active framework IDs used for question routing, progress tracking, and curriculum mapping.

The runtime anchor skills are:

- F001 Recognise Fractions
- F002 Numerator and Denominator
- F003 Fraction of a Whole
- F004 Unit Fractions
- F005 Fractions on Number Line
- F006 Compare Unit Fractions
- F007 Compare Same Denominator
- F008 Compare Same Numerator
- F009 Order Fractions
- F010 Equivalent Fractions
- F011 Generate Equivalent Fractions
- F012 Simplify Fractions
- F013 Improper Fractions
- F014 Mixed Numbers
- F015 Convert Mixed to/from Improper
- F016 Add Same Denominator
- F017 Subtract Same Denominator
- F018 Add Different Denominators
- F019 Subtract Different Denominators
- F020 Fraction of Quantity
- F021 Multiply Fractions
- F022 Divide Fractions
- F023 Fraction Word Problems
- F024 Multi-Step Fraction Problems
- F025 Exam-Style Fraction Applications
- F026 Fractions Mastery Challenge

These anchors are used consistently across the runtime skill graph, curriculum mapping, and question families. They are stable and should remain the canonical reporting spine for pilot launch.

## Anchor classification and audit summary

The current runtime anchors fall into three broad categories:

- Micro-skill anchors: focused teachable fraction skills.
- Lesson-level anchors: useful for curriculum and learning progress, but broader than a single teachable subskill.
- Topic-level / milestone anchors: large objectives that contain multiple distinct cognitive steps.

### Summary classification

- Micro-skill anchors: `F002`, `F004`, `F006`, `F007`, `F008`, `F010`, `F011`, `F012`, `F013`, `F014`, `F016`, `F017`, `F021`, `F022`
- Lesson-level anchors: `F001`, `F003`, `F005`, `F009`, `F015`, `F020`
- Topic-level / milestone anchors: `F018`, `F019`, `F023`, `F024`, `F025`, `F026`

### Key audit findings

1. `F009` Order Fractions is too broad.
   - It currently covers ordering by same denominator, same numerator, benchmark reasoning, and unlike fraction strategies.
   - Proposed split across comparison micro-skills in `Fractions II`.

2. `F015` Convert Mixed to/from Improper is a topic-level conversion objective.
   - It combines two directions of conversion plus comparison and number-line placement.
   - This is better expressed as multiple micro-skills under `Fractions III`.

3. `F018` and `F019` are large operational topics.
   - Each contains common denominator search, conversion, arithmetic, simplification, and mixed-number handling.
   - They should remain runtime objectives, but the underlying diagnostic scope should be decomposed into `Fractions IV` micro-skills.

4. `F023` and `F024` are broad word-problem anchors.
   - They currently bundle one-step and multi-step reasoning, schema selection, and model drawing.
   - These are natural parent anchors for `Fractions V`, `Fractions VI`, and model-drawing micro-skills.

5. `F025` and `F026` are assessment and mastery containers.
   - They are appropriate as milestone nodes, not teachable subskills.
   - Their role should remain summative and diagnostic.

## Crosswalk: `F001`-`F026` → proposed `FR1`-`FR7`

### Fractions I: Meaning and Models

- `F001` → FR1.01–FR1.08
- `F002` → FR1.07–FR1.08
- `F003` → FR1.03–FR1.05
- `F004` → FR1.09
- `F005` → FR1.10–FR1.12

### Fractions II: Comparison and Equivalence

- `F006` → FR2.01
- `F007` → FR2.02
- `F008` → FR2.03
- `F009` → FR2.04–FR2.07
- `F010` → FR2.08–FR2.09
- `F011` → FR2.10–FR2.12
- `F012` → FR2.13–FR2.15

### Fractions III: Improper Fractions, Mixed Numbers, and Conversion

- `F013` → FR3.01–FR3.02
- `F014` → FR3.03–FR3.04
- `F015` → FR3.05–FR3.08

### Fractions IV: Operations

- `F016` → FR4.01–FR4.02
- `F017` → FR4.03–FR4.04
- `F018` → FR4.05–FR4.08
- `F019` → FR4.09–FR4.11
- `F021` → FR4.12–FR4.15
- `F022` → FR4.16–FR4.18

### Fractions V: Fraction of Quantity and Model Drawing

- `F020` → FR5.01–FR5.04
- `F023` → FR5.05–FR5.08

### Fractions VI: Word Problems and Heuristics

- `F023` → FR6.01–FR6.12
- `F024` → FR6.08–FR6.12

### Fractions VII: Exam Applications and Mastery

- `F025` → FR7.01–FR7.05
- `F026` → FR7.06–FR7.07

## Runtime crosswalk details

The runtime still depends on the current canonical skill IDs, so the practical migration path is:

1. Keep `F001`-`F026` as the active skill anchors in the runtime and reporting layer.
2. Add a parallel micro-skill taxonomy in documentation and/or a new metadata layer.
3. Use the micro-skill taxonomy to drive diagnostics, item generation, rechecks, and remediation labels.
4. Preserve existing anchor IDs for curriculum mapping and progress tracking while exposing the more granular FR taxonomy in teaching materials.

This minimizes runtime disruption while enabling a future architecture where `F001`-`F026` become parent anchor nodes and `FR*` skills become the teachable subskills.

## Current runtime practices that support the crosswalk

- `fractionSkillGraph.js` already registers explicit prerequisites and question families for every `F001`-`F026` anchor.
- `fractionCurriculumMappings.js` maps every canonical `F001`-`F026` anchor to MOE curriculum rows and levels.
- `fractionUniversalSkills.js` creates a universal skill layer aligned to the canonical anchors.
- `fractionQuestionFamilies.js` defines question-family structures and working requirements per anchor.

These runtime practices mean the current system can support a two-layer architecture:

- Layer 1: canonical anchor IDs for reporting, curriculum mapping, and skill sequencing.
- Layer 2: micro-skill labels for remediation, model drawing, and fine-grained diagnostic classification.

## Gap analysis and recommended adjustments

### Anchor-level risks

- `F009` should not remain a single diagnostic target for all ordering strategies. It is currently too broad to support precise remediation for benchmark, same-denominator, same-numerator, and mixed-order reasoning.
- `F018` and `F019` should continue as runtime goals, but the underlying item generation and working-evidence expectations should be segmented by denominator strategy, simplification, and mixed-number conversion.
- `F023` and `F024` need explicit model-drawing architecture, because their current runtime labels do not distinguish between part-whole vs remainder vs transfer vs before-after schema.

### Micro-skill migration recommendations

- Use `F001`-`F005` to anchor early meaning and model-building while introducing `FR1` micro-skills that explicitly distinguish equal-part reasoning, whole identification, shaded/unshaded models, unit fractions, and number-line placement.
- Use `F006`-`F012` to anchor comparison/equivalence while introducing `FR2` micro-skills that distinguish benchmark reasoning, ordering patterns, equivalence recognition, generation, and simplification checks.
- Use `F013`-`F015` to anchor mixed/improper conversion while introducing `FR3` micro-skills for number-line placement, model representation, and both conversion directions.
- Use `F016`-`F022` to anchor operations while introducing `FR4` micro-skills for like-fraction addition/subtraction, unlike operations, simplification, multiplication, and division reasoning.
- Use `F020`-`F024` to anchor applied quantity and word-problem reasoning while introducing `FR5`/`FR6` micro-skills for quantity models, part-whole, remainder, schema identification, and two-step reasoning.
- Use `F025`-`F026` as summative milestone anchors while introducing `FR7` micro-skills for exam-style mixed review, method evidence, and remediation retests.

## Recommendations for documentation and follow-up work

- Create an explicit documentation layer or metadata file that maps each `F001`-`F026` anchor to its proposed `FR*` child micro-skills.
- Add a glossary entry explaining that `F001`-`F026` remain pilot reporting anchors, while `FR1`-`FR7` are future teachable diagnostics.
- For any future runtime migration, preserve existing question-family IDs and anchor prerequisites to avoid breaking current behavior.
- If runtime changes are eventually required, introduce `FR*` skills as supplemental metadata first and only change question routing after the micro-skill taxonomy is fully validated.

## Conclusion

The current runtime anchor set is a good stable foundation for pilot operation. This audit confirms that the best path forward is to keep `F001`-`F026` as the canonical runtime anchors and layer a finer-grained `FR1`-`FR7` taxonomy above them for diagnostics, remediation, and model drawing.

This document should serve as the crosswalk reference when migrating curriculum content, question generation, and teacher-facing documentation.

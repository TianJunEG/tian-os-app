# Fractions Skill Mapping Audit

Audit date: 2026-06-05  
Scope: active MathPath Fractions `F001-F026` skill inventory.  
Source audit: `FRACTIONS_PILOT_INVENTORY.md` plus active skill graph and SG curriculum mapping files.  
Audit mode: read-only. No production code, data, or mappings were changed.

## Purpose

This audit prepares the Fractions curriculum architecture for post-pilot expansion.

It checks whether each active F-code has:

- a correct MOE level mapping,
- a clear intended learning objective,
- alignment with the actual SG curriculum objective currently mapped to that code,
- appropriate scope for a teachable skill,
- prerequisite coverage,
- duplication or split risk.

## Executive Summary

The current 26-skill Fractions structure is usable as a pilot reporting spine, but it is not clean enough as a long-term curriculum architecture.

Main findings:

- `F001-F006` are broadly aligned enough for pilot use.
- `F007-F026` have significant F-code/title/curriculum mapping drift.
- Several current skills are topic-level containers rather than teachable micro-skills.
- The active graph is mostly a broad P4-P6 readiness path, while the curriculum mapping table often maps the same F-codes to P2/P3 objectives.
- Post-pilot expansion should introduce a topic -> micro-skill hierarchy instead of continuing to stretch the 26 F-codes.

Risk count:

- LOW: 6 skills
- MEDIUM: 3 skills
- HIGH: 17 skills

## Audit Table

| F-code | Current title | Current MOE level mapping | Intended learning objective | Actual SG curriculum objective currently mapped | Risk | Flags |
|---|---|---|---|---|---|---|
| F001 | Recognise Fractions | P2 -> P2 | Identify fractions as equal parts of a whole using simple visual models. | Identify a fraction as equal parts of a whole. | LOW | Slightly broad if it includes shape, set, bar, and equal-parts discrimination. Split later. |
| F002 | Numerator and Denominator | P2 -> P2 | Understand numerator and denominator roles in fraction notation. | Interpret numerator and denominator in fraction notation. | LOW | Good match. Keep as micro-skill or early foundation skill. |
| F003 | Fraction of a Whole | P2 -> P2 | Represent and interpret a fraction as part of one whole. | Recognise and represent unit fractions. | MEDIUM | Objective mismatch. Current skill is broader than unit fractions. Split into whole, part, shaded/unshaded, and notation matching. |
| F004 | Unit Fractions | P2 -> P2 | Identify and compare fractions with numerator 1. | Represent fractions of simple shapes and regions. | MEDIUM | Title/objective swapped with a visual fractions concept. Compare unit fractions is partly covered by F006. |
| F005 | Fractions on Number Line | P2/P3 -> P3 | Locate and read fractions on number lines with equal partitions. | Locate fractions on simple number lines. | LOW | Good enough. Split later into read, locate, interval partitioning, and beyond-one positions. |
| F006 | Compare Unit Fractions | P2 -> P2 | Compare unit fractions by denominator size. | Compare simple fractions using visual representation. | LOW | Acceptable early comparison mapping, but title is narrower than mapped objective. |
| F007 | Compare Same Denominator | P3 -> P3 | Compare fractions that share a common denominator. | Recognise equivalent fractions with model support. | HIGH | Wrong concept mapping. Duplicate risk with actual intended comparison sequence. Requires remap. |
| F008 | Compare Same Numerator | P3 -> P3 | Compare fractions with the same numerator using denominator reasoning. | Generate equivalent fractions using multiplication. | HIGH | Wrong concept mapping. Requires remap. |
| F009 | Order Fractions | P3 -> P3 | Arrange fractions in ascending or descending order. | Generate equivalent fractions using division. | HIGH | Wrong concept mapping and overly broad. Ordering should split by same denominator, same numerator, benchmarks, and unlike fractions. |
| F010 | Equivalent Fractions | P3 -> P3 | Recognise fractions that represent the same value. | Express fractions in simplest form. | HIGH | Wrong concept mapping. Current F010 should map to equivalence recognition, not simplification. |
| F011 | Generate Equivalent Fractions | P2 -> P2/P3 | Create equivalent fractions by scaling numerator and denominator. | Compare fractions with common denominators. | HIGH | Wrong concept mapping. Also should split multiply-scale and divide-scale later. |
| F012 | Simplify Fractions | P2/P3 -> P3 | Reduce fractions to simplest form using common factors/HCF. | Compare fractions with common numerators. | HIGH | Wrong concept mapping. Active objective is simplification, but mapped objective is comparison. |
| F013 | Improper Fractions | P3 -> P3 | Interpret and represent improper fractions greater than or equal to 1. | Compare unlike fractions using equivalent forms or benchmarks. | HIGH | Wrong concept mapping. Active objective belongs to P4 conversion/representation. |
| F014 | Mixed Numbers | P2/P3 -> P3 | Represent mixed numbers and connect whole plus fraction notation. | Order fractions from smallest to largest and vice versa. | HIGH | Wrong concept mapping. Active objective should be P4 mixed number representation. |
| F015 | Convert Mixed <-> Improper | P2 -> P2/P3 | Convert between mixed numbers and improper fractions. | Add like fractions within one whole. | HIGH | Wrong concept mapping and overly broad. Should split mixed-to-improper and improper-to-mixed. |
| F016 | Add Same Denominator | P2 -> P2/P3 | Add fractions with the same denominator. | Subtract like fractions within one whole. | HIGH | Wrong operation mapping. Current addition maps to subtraction objective. |
| F017 | Subtract Same Denominator | P3 -> P4 | Subtract fractions with the same denominator. | Add unlike fractions by converting to common denominators. | HIGH | Wrong operation mapping. Current subtraction maps to unlike addition. |
| F018 | Add Different Denominators | P3 -> P4 | Add unlike fractions by finding common denominators. | Subtract unlike fractions by converting to common denominators. | HIGH | Wrong operation mapping. Also broad; should split common denominator, add, simplify, mixed-number cases. |
| F019 | Subtract Different Denominators | P4 -> P4 | Subtract unlike fractions by converting to common denominators. | Interpret and represent improper fractions. | HIGH | Wrong concept mapping. Active objective is P5-like unlike subtraction, not P4 improper fractions. |
| F020 | Fraction of Quantity | P4 -> P4 | Find a fraction of a discrete or continuous quantity. | Interpret and represent mixed numbers. | HIGH | Wrong concept mapping. Also should split countable, continuous, unit fraction, non-unit fraction, and unit handling. |
| F021 | Multiply Fractions | P4 -> P4 | Multiply fractions and simplify where appropriate. | Convert between mixed numbers and improper fractions. | HIGH | Wrong concept mapping and likely wrong primary level. Current active title suggests P6/S1-style operations, not P4 conversion. |
| F022 | Divide Fractions | P5 -> P5 | Divide fractions using reciprocal relationships. | Add and subtract mixed numbers. | HIGH | Wrong concept mapping. Active division objective is not the mapped mixed-number operations objective. |
| F023 | Fraction Word Problems | P4 -> P4/P5 | Apply fraction operations in one-step contextual problems. | Find a fraction of a quantity or set of objects. | MEDIUM | Partial overlap only. Current title is broader than mapped objective. Split by schema. |
| F024 | Multi-Step Fraction Problems | P4/P5 -> P5/P6 | Solve multi-step fraction tasks involving conversion, operations, and reasoning. | Apply remainder reasoning in fraction contexts. | HIGH | Partial overlap but too broad. Should split remainder, remainder-of-remainder, sequence, work backwards, and branching/tree method. |
| F025 | Exam-Style Fraction Applications | P2/P3 -> P4 | Handle school-style fraction items in mixed formats and contexts. | Solve one-step and basic two-step fraction word problems. | HIGH | Active skill is an assessment-prep container, not a teachable skill. Current MOE level is too low/broad for exam-style applications. |
| F026 | Fractions Mastery Challenge | P4/P5 -> P5/P6 | Demonstrate consolidated mastery across fraction strands. | Solve multi-step fraction word problems with structured reasoning. | HIGH | Active skill is a capstone/milestone, not a teachable skill. Should not be mapped as a single teachable curriculum skill. |

## Incorrect MOE Level Mappings

High-confidence level issues:

- `F013-F015` are active P4 conversion skills, but current mapping places some of them in P2/P3 or comparison/ordering objectives.
- `F018-F019` are active unlike-denominator operation skills, but the mapping places them around P3/P4 and mismatches addition/subtraction.
- `F021-F022` are active multiply/divide fraction operation skills. These should not be mapped to P4 conversion or P5 mixed-number addition/subtraction if the active titles remain unchanged.
- `F025-F026` are currently broad application/mastery containers and should not be mapped as ordinary P4/P5/P6 teachable skills without child skills.

Medium-confidence level issues:

- `F003-F006` are early foundations and comparison skills, but their exact P2/P3 placement depends on whether the product is using them as remediation prerequisites for older students or as primary curriculum scope.
- `F023-F024` partly overlap with the mapped word-problem/remainder objectives but are too broad to serve as precise level mappings.

## Broad Skill Findings

These should become topic or milestone nodes after pilot:

- `F009` Order Fractions
- `F015` Convert Mixed <-> Improper
- `F018` Add Different Denominators
- `F019` Subtract Different Denominators
- `F020` Fraction of Quantity
- `F023` Fraction Word Problems
- `F024` Multi-Step Fraction Problems
- `F025` Exam-Style Fraction Applications
- `F026` Fractions Mastery Challenge

## Skills That Should Be Split Later

Priority split list:

- `F003`: whole identification, shaded part, unshaded part, fraction notation from model.
- `F005`: read number-line fractions, locate fractions, partition intervals, fractions greater than 1.
- `F009`: order same-denominator, same-numerator, unlike related denominators, benchmark ordering.
- `F010`: recognise equivalent models, equivalent number-line positions, symbolic equivalence.
- `F011`: generate by multiplication, generate by division, missing numerator/denominator.
- `F012`: common factor simplification, HCF simplification, simplest-form check.
- `F013-F015`: improper recognition, mixed number recognition, improper-to-mixed, mixed-to-improper.
- `F018-F019`: common denominator, proper fractions, simplify answer, mixed-number cases, regrouping.
- `F020`: unit fraction of quantity, non-unit fraction of quantity, countable contexts, continuous measures.
- `F023-F024`: part-whole, remainder, comparison, before-after, work backwards, fraction-of-remainder, branching/tree method.
- `F025-F026`: convert from active skill into assessment/checkpoint/capstone nodes with child teachable skills.

## Duplicate Skill Findings

- `F003` Fraction of a Whole overlaps with `F001` Recognise Fractions and `F004` Unit Fractions.
- `F004` Unit Fractions overlaps with `F006` Compare Unit Fractions if comparison is included.
- `F010` Equivalent Fractions and `F011` Generate Equivalent Fractions are valid as separate skills, but the current mapping table shifts equivalence concepts across `F007-F010`.
- `F013-F015` are distinct in active skill graph but should be split into recognition/representation/conversion directions to avoid hidden duplication.
- `F023`, `F024`, `F025`, and `F026` overlap heavily as application/problem-solving/capstone containers.

## Missing or Weak Prerequisite Relationships

Current active prerequisite graph is usable for pilot but needs tightening post-pilot.

Recommended prerequisite additions or refinements:

- `F009` should require `F010/F011` when ordering unlike fractions, not only comparison skills.
- `F012` should depend on factor/HCF readiness, not only `F011`.
- `F013` should depend on fractions beyond 1 on a number line/model, not only `F003/F010`.
- `F015` should depend on division with remainder or quotient/remainder understanding.
- `F018/F019` should explicitly require common denominator selection and simplification micro-skills.
- `F020` should depend on division/multiplication facts and whole/part identification.
- `F023/F024` should depend on problem-schema recognition, whole identification, and model drawing skills, not only operation skills.
- `F025/F026` should depend on a broad set of child micro-skills rather than one previous F-code.

## Missing Curriculum Areas

The active 26-skill structure covers enough for the pilot, but several Singapore Primary Mathematics Fractions areas are not yet represented with enough precision for diagnostic use.

These are not necessarily absent from all generated questions. The issue is that they are not cleanly represented as explicit teachable skills or prerequisite nodes.

| Missing / under-specified area | Current partial coverage | Why it matters | Recommended action |
|---|---|---|---|
| Fraction of remainder | F023/F024/F025/F026 | Common P5/P6 word-problem pattern; students often confuse original whole with new remainder. | Add explicit child skills for remainder, fraction of remainder, and remainder-of-remainder. |
| Branching/tree method | F024/F026, Story Mode examples | Common school-taught strategy similar to probability-tree reasoning. | Add as a model/heuristic skill under word problems. |
| Bar model construction | Model Trainer and Story Mode support | Critical for weak word-problem learners; currently a tool/pathway more than a skill map node. | Add model-drawing micro-skills under Fraction of Quantity and Word Problems. |
| Mixed-number regrouping | F019/F022 partly | P5 mixed-number subtraction often requires regrouping. | Add separate regrouping skill before mixed-number operations. |
| Adding/subtracting mixed numbers | F022 mapping references it, but active F022 is Divide Fractions | The curriculum mapping currently points to this area but the active skill title does not. | Add explicit mixed-number operation skills or remap F022 after pilot. |
| Advanced comparison using benchmarks | F009 broadly | Ordering/comparison needs 1/2, 1, equivalence, and benchmark strategies. | Split F009 into comparison/ordering subskills. |
| Fraction of set vs fraction of continuous quantity | F020 broadly | Countable-context constraints differ from litres/metres/mass contexts. | Split F020 into countable set, continuous quantity, and unit-handling skills. |
| Countability / integer validity in word problems | Generator guards exist | Students must learn why half of 41 objects is invalid in count contexts. | Add diagnostic/remediation tag or micro-skill under applications. |
| Unit conversion and answer units | F023-F026 partly | Many primary word problems require matching final answer to the asked unit. | Add sense-check / unit-check micro-skill under applications. |
| Work backwards | F024/F026 partly | Common high-value P5/P6 heuristic. | Add explicit skill and remediation path. |
| Before-after problems | F024/F026 partly | Distinct schema from ordinary part-whole and remainder problems. | Add schema-specific child skill. |
| Multi-step problem planning | F024/F026 broadly | Diagnosis needs to distinguish calculation weakness from planning weakness. | Add planning/sequence child skill. |

## Proposed Post-Pilot Structure

Recommended structure:

```text
Fractions
-> Topic
-> Skill
```

Keep current `F001-F026` as pilot reporting anchors until the pilot concludes. After pilot, introduce stable child skill IDs under topic nodes.

### Topic 1: Meaning and Models

- Identify equal and unequal parts
- Identify the whole
- Identify shaded fraction from a shape
- Identify unshaded fraction from a shape
- Identify fraction from a set
- Match fraction notation to model
- Interpret numerator
- Interpret denominator
- Identify unit fractions
- Read a fraction model in words and symbols

### Topic 2: Number Line and Size

- Read fractions on a 0-to-1 number line
- Locate fractions on a number line
- Partition an interval into equal parts
- Locate fractions greater than 1
- Compare unit fractions
- Compare same-denominator fractions
- Compare same-numerator fractions
- Compare using benchmark 1/2
- Order same-denominator fractions
- Order same-numerator fractions
- Order unlike fractions using equivalent forms or benchmarks

### Topic 3: Equivalence and Simplification

- Recognise equivalent fractions with models
- Recognise equivalent fractions symbolically
- Generate equivalent fractions by multiplication
- Generate equivalent fractions by division
- Find a missing numerator or denominator
- Simplify by a common factor
- Simplify using HCF
- Check simplest form

### Topic 4: Improper Fractions and Mixed Numbers

- Interpret improper fractions
- Represent improper fractions with models
- Interpret mixed numbers
- Represent mixed numbers with models
- Convert improper fraction to mixed number
- Convert mixed number to improper fraction
- Compare mixed numbers and improper fractions
- Place mixed numbers/improper fractions on a number line

### Topic 5: Fraction Operations

- Add same-denominator fractions
- Add same-denominator fractions with improper result
- Subtract same-denominator fractions
- Subtract from one whole
- Find a common denominator
- Add unlike fractions
- Add unlike fractions and simplify
- Subtract unlike fractions
- Subtract unlike fractions with regrouping
- Add/subtract mixed numbers
- Multiply a fraction by a whole number
- Multiply a fraction by a fraction
- Simplify during multiplication
- Divide a fraction by a whole number
- Divide by a fraction using reciprocal

### Topic 6: Fraction of Quantity and Model Drawing

- Find a unit fraction of a countable quantity
- Find a non-unit fraction of a countable quantity
- Find a fraction of a continuous quantity
- Handle countable-context constraints
- Draw a part-whole bar model
- Draw a remainder bar model
- Label known quantity in a model
- Find one unit from a model
- Subdivide a remainder
- Use branching/tree method for fraction-of-remainder problems

### Topic 7: Word Problems and Heuristics

- Identify what the question asks for
- Identify whole, part, and remainder
- Choose operation from context
- Solve one-step part-whole word problems
- Solve fraction-of-quantity word problems
- Solve remainder problems
- Solve before-after problems
- Solve comparison problems
- Work backwards from a remaining amount
- Solve fraction-of-remainder problems
- Check whether the answer matches the question
- Check unit and reasonableness

### Topic 8: Checkpoints and Mastery

These should not be ordinary teachable skills. They should become assessment/checkpoint containers.

- Basic Fractions Checkpoint
- Operations Checkpoint
- Word Problem Checkpoint
- Multi-Step Problem-Solving Checkpoint
- P4 Readiness Checkpoint
- P5 Readiness Checkpoint
- P6/PSLE Readiness Checkpoint

## Recommended Migration Plan After Pilot

1. Freeze `F001-F026` as pilot-era reporting anchors.
2. Create new child micro-skill IDs under the proposed topics.
3. Correct SG curriculum mappings to match active skill meanings.
4. Re-map question families to child micro-skills.
5. Preserve old F-code aliases for historical pilot data.
6. Re-run coverage by child skill, not only by F-code.
7. Update diagnostic decisions to target child skills while parent dashboards can still roll up to topic/F-code anchors.

## Recommended Expansion Priority

Recommended post-pilot build order:

1. Correct F-code to SG curriculum mapping table.
   - Highest priority because current mapping drift can affect diagnostics, dashboards, reports, and parent/tutor interpretation.

2. Split application/problem-solving nodes.
   - Start with `F023`, `F024`, `F025`, and `F026`.
   - These are the most important for students who can calculate but struggle with word problems.

3. Add explicit model-drawing and schema-recognition skills.
   - Add part-whole model, remainder model, fraction-of-remainder model, branching/tree method, and work-backwards strategy.

4. Split fraction-of-quantity.
   - Separate countable set, continuous quantity, unit fraction, non-unit fraction, and countability validation.

5. Split mixed-number and improper-fraction conversion.
   - Separate recognition, representation, improper-to-mixed, mixed-to-improper, and mixed-number regrouping.

6. Split unlike-denominator operations.
   - Separate common denominator selection, addition, subtraction, simplification, regrouping, and mixed-number cases.

7. Expand comparison and ordering.
   - Add benchmark comparison, unlike-fraction comparison, and ordering with mixed strategies.

8. Re-run coverage by micro-skill.
   - Existing F-code coverage is pilot-ready, but post-pilot coverage must be measured against the new micro-skill structure.

## Final Recommendation

Do not change active mappings before the 5-student pilot unless a specific mapping is causing a visible student/parent bug.

For post-pilot expansion, the first curriculum task should be a mapping correction and micro-skill decomposition sprint. This is more important than adding more raw questions because the current coverage is already adequate for pilot, while the curriculum architecture is the main scale risk.

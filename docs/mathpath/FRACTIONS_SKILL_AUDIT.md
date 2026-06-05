# Fractions Skill Audit

Phase 1A audit for the current MathPath Fractions skill structure.

Scope: existing F001-F026 inventory only. No question generation or production selection changes are included in this phase.

Question Count means current question-family coverage from `fractionQuestionFamilies.js`, not generated database rows.

## Summary

- Current structure is a flat F001-F026 sequence with strands and prerequisites.
- The sequence mixes concept, topic, micro-skill, assessment-prep, and capstone entries.
- P4-relevant content is present, but several F-codes are too broad for diagnostics.
- Future systems should target micro-skills while keeping F-codes as backward-compatible aliases.
- Some source mappings disagree on year placement. The knowledge map therefore records P4-ready concepts and marks P5/P6 extensions as deferred.

## Audit Table

| Current Skill | Description | Question Count | Concept Represented | Current Granularity | Split? | Recommended Topic | Recommended Micro Skill(s) |
|---|---|---:|---|---|---|---|---|
| F001 Recognise Fractions | Identify fractions as equal parts of a whole using simple models. | 5 | Equal parts and part-whole recognition | Topic-level foundation | Yes | Understanding Fractions | recognise equal parts of one whole; reject unequal partitions; name shaded fraction |
| F002 Numerator and Denominator | Explain the meaning of numerator and denominator in a fraction. | 5 | Fraction notation and role language | Micro-skill cluster | Yes | Understanding Fractions | explain numerator; explain denominator; detect swapped roles |
| F003 Fraction of a Whole | Represent and interpret a fraction as part of one whole. | 3 | Part-whole representation | Topic-level foundation | Yes | Understanding Fractions | fraction from area model; fraction from bar model; match visual representations |
| F004 Unit Fractions | Identify and compare fractions with numerator 1 as unit fractions. | 3 | Unit fraction recognition and size reasoning | Micro-skill cluster | Yes | Understanding Fractions | identify unit fractions; represent 1/n; reason about denominator size |
| F005 Fractions on Number Line | Locate and read fractions on number lines with equal partitions. | 3 | Linear representation of fractions | Micro-skill cluster | Yes | Understanding Fractions | partition 0-1 interval; locate unit fractions; locate non-unit fractions |
| F006 Compare Unit Fractions | Compare unit fractions by reasoning about denominator size. | 3 | Unit-fraction comparison | Micro-skill | No | Comparing and Ordering Fractions | compare 1/a and 1/b; order unit fractions |
| F007 Compare Same Denominator | Compare fractions that share the same denominator. | 3 | Same-denominator comparison | Micro-skill | No | Comparing and Ordering Fractions | compare same-denominator pairs; order same-denominator sets |
| F008 Compare Same Numerator | Compare fractions with same numerator by denominator relationship. | 3 | Same-numerator comparison | Micro-skill | No | Comparing and Ordering Fractions | compare same-numerator pairs; order same-numerator sets |
| F009 Order Fractions | Arrange fractions in ascending or descending order. | 3 | Fraction ordering across comparison cases | Topic-level application | Yes | Comparing and Ordering Fractions | order same-denominator sets; order same-numerator sets; order related-denominator sets |
| F010 Equivalent Fractions | Recognise fractions that represent the same value. | 3 | Equivalence recognition | Micro-skill cluster | Yes | Equivalent Fractions and Simplest Form | recognise equivalent fractions; validate equivalent statements; match model equivalence |
| F011 Generate Equivalent Fractions | Create equivalent fractions through scaling by common factors. | 5 | Scaling numerator and denominator | Micro-skill cluster | Yes | Equivalent Fractions and Simplest Form | scale up by multiplication; fill missing equivalent term; generate equivalent chains |
| F012 Simplify Fractions | Reduce fractions to simplest form using highest common factors. | 5 | Simplification and common factors | Micro-skill cluster | Yes | Equivalent Fractions and Simplest Form | simplify by common factor; simplify to lowest terms; simplify after operations |
| F013 Improper Fractions | Interpret and represent improper fractions greater than or equal to 1. | 4 | Values at least one in fraction form | Micro-skill cluster | Yes | Improper Fractions and Mixed Numbers | recognise improper fractions; represent improper fractions visually; interpret values greater than one |
| F014 Mixed Numbers | Represent mixed numbers and connect them to improper fractions. | 4 | Whole-plus-fraction notation | Micro-skill cluster | Yes | Improper Fractions and Mixed Numbers | recognise mixed numbers; represent mixed numbers; compare simple mixed numbers |
| F015 Convert Mixed <-> Improper | Convert between mixed numbers and improper fractions accurately. | 5 | Bidirectional conversion | Topic-level conversion cluster | Yes | Improper Fractions and Mixed Numbers | convert mixed to improper; convert improper to mixed; choose form in context |
| F016 Add Same Denominator | Add fractions that share a common denominator. | 3 | Like-denominator addition | Micro-skill cluster | Yes | Fraction Operations | add same-denominator fractions; simplify result; apply in context |
| F017 Subtract Same Denominator | Subtract fractions with same denominator while preserving denominator. | 4 | Like-denominator subtraction | Micro-skill cluster | Yes | Fraction Operations | subtract same-denominator fractions; simplify result; apply in context |
| F018 Add Different Denominators | Add unlike fractions by finding common denominators first. | 6 | Unlike-fraction addition | Topic-level operation cluster | Yes | Fraction Operations | find common denominator; scale numerator; add; simplify or convert final answer |
| F019 Subtract Different Denominators | Subtract unlike fractions by converting to common denominators. | 4 | Unlike-fraction subtraction | Topic-level operation cluster | Yes | Fraction Operations | find common denominator; subtract; regroup if needed; simplify final answer |
| F020 Fraction of Quantity | Find a fraction of a discrete or continuous quantity. | 6 | Fraction of set or measure | Topic-level application | Yes | Fraction of Quantity and Problem Solving | unit fraction of quantity; non-unit fraction of quantity; whole-number intermediate checks |
| F021 Multiply Fractions | Multiply fractions and simplify results where appropriate. | 5 | Fraction multiplication | Later-year topic | Yes, later | Deferred P5/P6 Operations | multiply fraction by whole number; multiply fraction by fraction; simplify products |
| F022 Divide Fractions | Divide fractions using reciprocal relationships. | 5 | Fraction division | Later-year topic | Yes, later | Deferred P5/P6 Operations | divide by whole number; divide by fraction; reciprocal method |
| F023 Fraction Word Problems | Apply fraction operations in one-step contextual problems. | 6 | Contextual fraction application | Topic-level application | Yes | Fraction of Quantity and Problem Solving | identify whole; choose operation; model one-step word problem; answer required unknown |
| F024 Multi-Step Fraction Problems | Solve multi-step fraction tasks involving conversion and operations. | 4 | Sequenced contextual reasoning | Topic-level application | Yes | Fraction of Quantity and Problem Solving | fraction of remainder; two-step sequence; model-based multi-step reasoning |
| F025 Exam-Style Fraction Applications | Handle school-style fraction items in mixed formats and contexts. | 5 | Mixed assessment format | Assessment-prep bucket | Yes | Fraction of Quantity and Problem Solving | contextual application; hidden operation selection; explain method |
| F026 Fractions Mastery Challenge | Demonstrate consolidated mastery across all fraction strands. | 5 | Capstone mastery across strands | Capstone bucket | Yes, after maps mature | Deferred Mastery/Capstone | retention check; mixed drill; capstone application |

## Key Findings

1. F001-F005 form prerequisite understanding rather than a clean P4 topic sequence.
2. F006-F009 are diagnostically useful but should be grouped under Comparing and Ordering.
3. F010-F012 are coherent as an equivalence topic, but each needs micro-skill tracking for recognition, generation, and simplification.
4. F013-F015 should split conversion directions because mixed-to-improper and improper-to-mixed have different error patterns.
5. F016-F019 should split "rename to common denominator" from "operate after renaming".
6. F020-F025 are currently broad application buckets. P4 needs explicit micro-skills for quantity, remainder, unknown selection, and modelling.
7. F021, F022, and F026 should not be expanded in P4 Phase 1. They remain compatibility references for future P5/P6 maps.

## Backward Compatibility Recommendation

- Keep F001-F026 as stable legacy skill IDs.
- Add `legacySkillIds` to each micro-skill so old records can map into the new hierarchy.
- Do not rewrite historical attempts immediately.
- Add a resolver layer later: `legacySkillId -> topicId -> microSkillIds`.
- New diagnostics should eventually emit `microSkillId`, while existing screens can continue reading `skillId`.

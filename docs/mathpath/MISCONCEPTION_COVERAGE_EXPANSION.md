# MathPath Misconception Coverage Expansion

## Executive Summary

This sprint adds a first explicit MathPath misconception coverage layer:

- `services/mathpath/misconceptionRegistry.js`
- `services/mathpath/skillMisconceptionMap.js`
- `services/mathpath/misconceptionCoverageService.js`

The current goal is not to add more questions. It is to make the evidence chain clearer:

```text
Wrong Answer
  -> Misconception Identified
  -> Intervention Assigned
  -> Recheck Improvement Measured
```

Current status: coverage foundation implemented. Detection is still mostly heuristic and should be strengthened with targeted diagnostic items and richer working-analysis evidence.

## Coverage Matrix

| Skill | Skill Name | Misconceptions Currently Covered | Missing / Needs Stronger Evidence | Remediation Coverage | Diagnostic Coverage |
| --- | --- | --- | --- | --- | --- |
| F001 | Recognise Fractions | equal_parts_missing, whole_number_thinking | none | visual_model, guided_practice, recheck | visual_fraction_identification |
| F002 | Numerator and Denominator | numerator_denominator_confusion, equal_parts_missing | none | guided_example, targeted_practice, recheck | notation_interpretation |
| F003 | Fraction of a Whole | equal_parts_missing, numerator_denominator_confusion, whole_number_thinking | none | visual_model, guided_practice, recheck | shaded_shape |
| F004 | Unit Fractions | compares_denominators_only, whole_number_thinking | none | visual_model, number_line, targeted_practice, recheck | unit_fraction_identification |
| F005 | Fractions on Number Line | whole_number_thinking, equal_parts_missing, numerator_denominator_confusion | none | number_line, guided_practice, recheck | number_line |
| F006 | Compare Unit Fractions | compares_denominators_only, whole_number_thinking | none | visual_model, number_line, targeted_practice, recheck | unit_fraction_comparison |
| F007 | Compare Same Denominator | compares_numerators_only, whole_number_thinking | none | visual_model, common_denominator_guide, targeted_practice, recheck | same_denominator_comparison |
| F008 | Compare Same Numerator | compares_denominators_only, whole_number_thinking | none | visual_model, common_denominator_guide, targeted_practice, recheck | same_numerator_comparison |
| F009 | Order Fractions | compares_denominators_only, compares_numerators_only, common_denominator_missing | none | visual_model, common_denominator_guide, targeted_practice, recheck | ordering |
| F010 | Equivalent Fractions | equivalence_scale_error, whole_number_thinking | none | area_model, guided_example, targeted_practice, recheck | equivalent_fraction_recognition |
| F011 | Generate Equivalent Fractions | equivalence_scale_error, numerator_denominator_confusion | none | area_model, guided_example, targeted_practice, recheck | equivalent_fraction_generation |
| F012 | Simplify Fractions | incorrect_simplification, equivalence_scale_error | none | factor_review, targeted_practice, recheck | simplification |
| F013 | Improper Fractions | whole_number_thinking, numerator_denominator_confusion | none | visual_model, guided_example, targeted_practice, recheck | improper_fraction_representation |
| F014 | Mixed Numbers | mixed_improper_conversion_error, whole_number_thinking | none | visual_model, guided_example, targeted_practice, recheck | mixed_number_representation |
| F015 | Convert Mixed ↔ Improper | mixed_improper_conversion_error, numerator_denominator_confusion, calculation_error | none | visual_model, guided_example, targeted_practice, recheck | mixed_improper_conversion |
| F016 | Add Same Denominator | adds_denominators_directly, numerator_denominator_confusion, calculation_error | none | guided_example, fluency, targeted_practice, recheck | like_denominator_addition |
| F017 | Subtract Same Denominator | subtracts_denominators_directly, numerator_denominator_confusion, calculation_error | none | guided_example, fluency, targeted_practice, recheck | like_denominator_subtraction |
| F018 | Add Different Denominators | common_denominator_missing, adds_denominators_directly, incorrect_simplification, calculation_error | none | common_denominator_guide, guided_example, worksheet, recheck | unlike_denominator_addition |
| F019 | Subtract Different Denominators | common_denominator_missing, subtracts_denominators_directly, regrouping_with_mixed_numbers_error, calculation_error | none | common_denominator_guide, guided_example, worksheet, recheck | unlike_denominator_subtraction |
| F020 | Fraction of Quantity | fraction_of_quantity_whole_error, operation_mismatch, calculation_error | none | bar_model, guided_example, targeted_practice, recheck | fraction_of_quantity |
| F021 | Multiply Fractions | operation_mismatch, incorrect_simplification, calculation_error | none | concept_review, guided_example, targeted_practice, recheck | fraction_multiplication |
| F022 | Divide Fractions | operation_mismatch, mixed_improper_conversion_error, calculation_error | none | concept_review, guided_example, targeted_practice, recheck | fraction_division |
| F023 | Fraction Word Problems | operation_mismatch, fraction_of_quantity_whole_error, skipped_step, calculation_error | none | story_mode, bar_model, targeted_practice, recheck | word_problem_one_step |
| F024 | Multi-Step Fraction Problems | skipped_step, uses_original_instead_of_remainder, operation_mismatch, did_not_work_backwards | none | story_mode, working_scaffold, targeted_practice, recheck | word_problem_multi_step |
| F025 | Exam-Style Fraction Applications | did_not_work_backwards, uses_original_instead_of_remainder, operation_mismatch, skipped_step | none | story_mode, worksheet, targeted_practice, recheck | exam_application |
| F026 | Fractions Mastery Challenge | skipped_step, operation_mismatch, calculation_error, did_not_work_backwards, common_denominator_missing | none | mixed_review, worksheet, recheck | mixed_mastery |

## Diagnostic Detection Findings

The current diagnostic can tag some misconceptions through answer text, supported metadata, and final correctness. It is still not strong enough to confidently distinguish every misconception because many items are not designed as misconception probes.

Priority missing evidence items:

1. Same numerator vs same denominator contrast items.
2. Equivalent fraction scaling distractors.
3. Simplification wrong-factor distractors.
4. Mixed/improper conversion distractors.
5. Word-problem "wrong whole" probes.
6. Remainder vs original-whole probes.
7. Work-backwards recognition probes.

## Paper Analysis Detection

Paper analysis now combines:

- keyword skill mapping
- registry-backed misconception detection
- adult-confirmed skill overrides
- teacher-marked correctness where available

Confidence is still heuristic. Low-confidence mappings must remain adult-reviewed.

## Working Evidence Integration

Working insight now attaches:

- `misconceptionTags`
- `misconceptionConfidence`

The current pipeline can detect:

- procedure errors
- denominator/numerator confusion
- common-denominator issues
- skipped or missing steps
- calculation-error patterns where evidence is visible

Remaining gaps:

- It cannot reliably distinguish careless arithmetic from conceptual misunderstanding without clearer step extraction.
- It cannot infer method quality from blank or unreadable working.
- It should eventually map every detected procedure misconception to the registry ID.

## Remediation Alignment

All active F001-F026 skills now have at least one mapped remediation priority and recheck path in the coverage service.

Remaining remediation gaps:

- Some remediation labels are capability placeholders, not confirmed high-quality lesson assets.
- Story Mode and working scaffold support is strongest for word-problem skills but should be connected more explicitly to remediation assignment.
- Recheck verification exists conceptually, but not every misconception has a dedicated recheck item family.

## Admin Coverage Route

Added:

- API: `GET /api/admin/misconception-coverage`
- Page: `/admin/misconception-coverage`

The page is a simple table showing:

- coverage %
- mapped misconceptions
- diagnostic evidence
- remediation support
- gaps

## Recommended Next Sprint

Build misconception-specific diagnostic probe items for the top 8 high-impact misconceptions:

1. `adds_denominators_directly`
2. `subtracts_denominators_directly`
3. `common_denominator_missing`
4. `compares_denominators_only`
5. `equivalence_scale_error`
6. `incorrect_simplification`
7. `fraction_of_quantity_whole_error`
8. `uses_original_instead_of_remainder`

Each probe should include:

- expected wrong answer pattern
- supported misconception tag
- remediation target
- recheck item family

# FR3 Mixed Numbers + Improper Fractions — Implementation Spec

> **Status**: Draft — do not commit until reviewed.
> **Scope**: Docs-only spec for FR3 coverage upgrade (GitHub Issue #59).
> **Runtime anchors**: F013, F014, F015, optional F009.

---

## 1. Target Runtime Anchors

| Anchor | Skill Name | Strand | Introduced | Mastery | Prerequisites |
|--------|-----------|--------|-----------|---------|---------------|
| F013 | Improper Fractions | Conversion | P4 | P4 | F003, F010 |
| F014 | Mixed Numbers | Conversion | P4 | P5 | F013 |
| F015 | Convert Mixed ↔ Improper | Conversion | P4 | P5 | F013, F014 |
| F009 | Comparing Fractions (optional) | Comparison | P3 | P4 | F003, F004 |

F001–F026 remain the **runtime skill IDs**. FR3.xx codes are an internal micro-skill taxonomy used for curriculum planning only — they do not appear in student-facing UI or database records.

---

## 2. FR3.01–FR3.07 Coverage Table

| Micro-skill | Title | Parent Anchor | Concept Tested | Template Type | Visual Required |
|-------------|-------|---------------|----------------|---------------|-----------------|
| FR3.01 | Interpret improper fractions as more than one whole | F013 | Meaning of numerator > denominator | Visual counting | shaded_fraction_model |
| FR3.02 | Represent improper fractions with models | F013 | Draw/select correct shaded model | Visual representation | shaded_fraction_model |
| FR3.03 | Interpret mixed numbers as whole plus fraction | F014 | Read and compose mixed numbers | Symbolic interpretation | shaded_fraction_model |
| FR3.04 | Represent mixed numbers with models | F014 | Build mixed number from visual | Visual representation | shaded_fraction_model |
| FR3.05 | Convert improper fraction to mixed number | F015 | Division with quotient + remainder | Procedural conversion | fraction_strip |
| FR3.06 | Convert mixed number to improper fraction | F015 | Multiply whole × denominator + numerator | Procedural conversion | fraction_strip |
| FR3.07 | Compare mixed numbers and improper fractions | F015, F009 | Convert to common form then compare | Comparison | fraction_strip |

Optional extension (not required for FR3 milestone):

| FR3.08 | Place mixed/improper on a number line | F005, F015 | Locate values beyond one whole | Number line placement | number_line |

---

## 3. Question Template Types

### 3.1 Improper Fraction Visual / Counting (FR3.01, FR3.02 → F013)

**Template A — Count shaded parts across wholes**
- Prompt: "How many equal parts are shaded? Write as a fraction."
- Visual: 2–3 circles/rectangles divided into equal parts, some fully shaded, last partially shaded.
- Example: 3 circles divided into 4 parts each, 9 parts shaded → 9/4.
- Answer format: `{ numerator, denominator }`.
- Accepted: `"9/4"`.

**Template B — Identify improper fractions**
- Prompt: "Which of these fractions is greater than 1 whole?"
- Options: 3/5, 7/4, 2/3, 1/2.
- Answer format: single selection.
- Accepted: `"7/4"`.

**Template C — Represent improper fraction with model**
- Prompt: "Shade the model to show 7/3."
- Visual: 3 rectangles divided into thirds; student shades 7 parts.
- Answer format: shading interaction or equivalent numeric confirmation.

### 3.2 Mixed Number Interpretation (FR3.03, FR3.04 → F014)

**Template D — Read a mixed number**
- Prompt: "Write the mixed number shown: [2 full circles + 1/4 shaded]."
- Visual: whole shapes fully shaded + partial shape.
- Answer format: `{ whole, numerator, denominator }`.
- Accepted: `"2 1/4"`.

**Template E — Compose mixed number from parts**
- Prompt: "A recipe needs 3 whole cups and 2/5 of a cup. Write this as a mixed number."
- No visual required (contextual).
- Answer format: `{ whole, numerator, denominator }`.
- Accepted: `"3 2/5"`.

**Template F — Represent mixed number with model**
- Prompt: "Shade the model to show 1 3/5."
- Visual: 2 rectangles divided into fifths; shade 1 full + 3 parts.
- Answer format: shading interaction or numeric confirmation.

### 3.3 Mixed Number → Improper Fraction (FR3.06 → F015)

**Template G — Convert mixed to improper**
- Prompt: "Convert 2 3/4 to an improper fraction."
- Solution steps: Multiply 2 × 4 = 8, add 3 = 11, write 11/4.
- Answer format: `{ numerator, denominator }`.
- Accepted: `"11/4"`.
- Visual (optional): fraction strip showing 2 full groups of 4 + 3 extra.

### 3.4 Improper Fraction → Mixed Number (FR3.05 → F015)

**Template H — Convert improper to mixed**
- Prompt: "Write 13/5 as a mixed number."
- Solution steps: 13 ÷ 5 = 2 remainder 3, so 2 3/5.
- Answer format: `{ whole, numerator, denominator }`.
- Accepted: `"2 3/5"`, `"13/5"` (equivalent accepted).
- Visual (optional): fraction strip showing 13 fifths grouped into wholes.

### 3.5 Comparing Mixed Number and Improper Fraction (FR3.07 → F015, F009)

**Template I — Compare by converting to common form**
- Prompt: "Which is greater: 2 1/3 or 8/3?"
- Solution steps: Convert 2 1/3 → 7/3; compare 7/3 vs 8/3; 8/3 is greater.
- Answer format: selection or symbol (>, <, =).
- Accepted: `"8/3"` or `">"`.

**Template J — Order mixed and improper values**
- Prompt: "Arrange from smallest to largest: 5/2, 1 3/4, 11/4."
- Solution steps: Convert all to improper with common denominator or to decimals.
- Answer format: ordered list.
- Accepted: `["1 3/4", "5/2", "11/4"]`.

---

## 4. Expected Answer Formats Summary

| Template | Input Type | Primary Format | Equivalent Accepted |
|----------|-----------|---------------|---------------------|
| A | Fraction | `n/d` | — |
| B | Selection | Single choice | — |
| C | Shading | Interaction | Numeric fallback |
| D | Mixed number | `w n/d` | — |
| E | Mixed number | `w n/d` | — |
| F | Shading | Interaction | Numeric fallback |
| G | Fraction | `n/d` | — |
| H | Mixed number | `w n/d` | Improper equivalent |
| I | Comparison | `>`, `<`, `=` or selection | — |
| J | Ordering | Ordered list | — |

---

## 5. Diagram / Visual Requirements

| Anchor | Required Visual | Optional Visual | Rationale |
|--------|----------------|-----------------|-----------|
| F013 | `shaded_fraction_model` | `fraction_strip` | Improper fractions need more-than-one-whole representation |
| F014 | `shaded_fraction_model` | `fraction_strip` | Mixed numbers need whole-plus-part representation |
| F015 | `fraction_strip` | `shaded_fraction_model` | Conversion needs visible groups of denominator-sized wholes |
| F009 | `fraction_strip` | `number_line` | Comparison benefits from aligned linear visuals |

Visual models are registered in `services/mathpath/visualModelRegistry.js`. Templates A, C, D, F require diagram generation; Templates B, E, G, H can use text-only with optional visuals.

---

## 6. Misconception Tags

| Misconception ID | Name | Applies To | Detection Signal |
|------------------|------|-----------|-----------------|
| `whole_number_thinking` | Whole-number thinking | F013 (primary) | Treats 7/4 < 3/5 because 7 < 3×5 or compares numerators/denominators as isolated numbers |
| `numerator_denominator_confusion` | Numerator/denominator confusion | F013 (secondary), F015 (secondary) | Writes 4/7 when shown 7 parts out of 4-part wholes |
| `mixed_improper_conversion_error` | Mixed/improper conversion error | F014 (primary), F015 (primary) | Forgets to add fractional part: 2 1/3 → 6/3 instead of 7/3 |
| `calculation_error` | Calculation error | F015 (secondary) | Correct method but arithmetic mistake: 2×4+3 = 10 instead of 11 |
| `wrong_whole_identified` | Wrong whole identified | F013, F014 (families) | Counts total shapes instead of total equal parts as denominator |
| `improper_fraction_conversion_error` | Improper conversion error | F013, F015 (families) | Remainder error in division: 13÷5 = 2r1 instead of 2r3 |
| `answer_form_mismatch` | Answer form mismatch | F015 (family _003) | Gives improper fraction when mixed number requested, or vice versa |
| `number_line_partition_error` | Number line partition error | F015 (family _005) | Places value at wrong tick mark; does not count partitions correctly |

---

## 7. Wrong-Answer Examples

| Template | Wrong Answer | Misconception Triggered | Explanation |
|----------|-------------|------------------------|-------------|
| A (count shaded) | "9/3" for 9 shaded parts across 4-part circles | `wrong_whole_identified` | Used number of circles (3) as denominator instead of parts per circle (4) |
| D (read mixed) | "3/4" for 2 full + 1/4 | `whole_number_thinking` | Ignored whole part entirely, counted total visible fraction parts |
| G (mixed→improper) | "6/4" for 2 3/4 | `mixed_improper_conversion_error` | Multiplied 2×3=6, put over 4; forgot to add numerator |
| G (mixed→improper) | "23/4" for 2 3/4 | `calculation_error` | Concatenated 2 and 3 instead of computing 2×4+3 |
| H (improper→mixed) | "2 1/5" for 13/5 | `improper_fraction_conversion_error` | 13÷5=2r1 (wrong remainder; correct is 2r3) |
| H (improper→mixed) | "5/13" for 13/5 | `numerator_denominator_confusion` | Flipped numerator and denominator |
| I (compare) | "2 1/3 > 8/3" | `mixed_improper_conversion_error` | Converted 2 1/3 → 8/3 instead of 7/3, then compared incorrectly |

---

## 8. Remediation Copy

### mixed_improper_conversion_error
> "We noticed your child sometimes forgets to add the extra fraction part when changing a mixed number to an improper fraction. For example, to convert 2 1/3, first multiply 2 × 3 = 6 thirds for the whole parts, then add the extra 1 third to get 7/3. Practising with fraction strips — colouring whole groups and then the leftover — helps build the habit."

### whole_number_thinking
> "Your child is sometimes comparing fractions by looking at the numbers on top and bottom separately, the way we compare whole numbers. With fractions, the size of each piece matters as much as how many pieces there are. Drawing fraction strips of the same length side by side helps show which fraction is actually larger."

### numerator_denominator_confusion
> "Your child sometimes swaps the top and bottom numbers of a fraction. The top number (numerator) counts how many parts are selected, and the bottom number (denominator) tells how many equal parts make up one whole. A simple check — 'how many parts do I have out of how many equal parts?' — can help."

### calculation_error
> "Your child understands the method but is making small arithmetic mistakes. Encourage a quick estimation check: for 2 3/4, the answer must be bigger than 2×4=8 fourths and less than 3×4=12 fourths, so 11/4 is reasonable."

---

## 9. Recheck Patterns

| Misconception | Recheck Strategy | What Recheck Validates |
|---------------|-----------------|----------------------|
| `mixed_improper_conversion_error` | `convert_both_directions` | Student converts mixed→improper AND improper→mixed correctly for a new pair of values |
| `whole_number_thinking` | `comparison_with_visual_reasoning` | Student correctly compares two fractions and explains or selects the correct visual model |
| `numerator_denominator_confusion` | `notation_role_transfer` | Student correctly identifies numerator and denominator roles in a novel fraction context |
| `calculation_error` | `same_method_new_numbers` | Student repeats the correct procedure with different numbers and gets correct arithmetic |
| `wrong_whole_identified` | `visual_part_whole_check` | Student correctly identifies denominator from a new visual model |
| `improper_fraction_conversion_error` | `division_remainder_check` | Student correctly divides and states quotient and remainder for a new improper fraction |

Rechecks should validate: "Was this specific misconception resolved?" — not just "Did the student get a correct answer?"

---

## 10. Suggested Tests

### Frontend (fractionQuestionGenerator.test.js)
1. F013 generates questions with numerator > denominator.
2. F014 generates questions with valid mixed number (whole ≥ 1, 0 < numerator < denominator).
3. F015 generates both conversion directions.
4. All F013/F014/F015 questions include solution steps.
5. Accepted answers include equivalent forms where specified.
6. Seed determinism: same seed produces same question.

### Frontend (fractionQuestionFamilies.test.js)
7. Each F013/F014/F015 family has misconception tags.
8. Family difficulty progresses from 2 to 4.
9. No family uses generic `"fraction_error"` tag.

### Backend (questionDiagramRequirementEngine.test.js)
10. F013 requires `shaded_fraction_model`.
11. F014 requires `shaded_fraction_model`.
12. F015 requires `fraction_strip`.

### Backend (skillVisualRequirementEngine.test.js)
13. Visual requirements match the table in section 5.

### Backend (misconceptionDetectionService.test.js)
14. Wrong answer 6/4 for "convert 2 3/4" triggers `mixed_improper_conversion_error`.
15. Wrong answer 4/7 for "write as fraction" triggers `numerator_denominator_confusion`.
16. Wrong answer with correct method but wrong arithmetic triggers `calculation_error`.

### Backend (recheckRecommendationService.test.js)
17. Recheck for `mixed_improper_conversion_error` uses `convert_both_directions` strategy.
18. Recheck for `whole_number_thinking` uses `comparison_with_visual_reasoning` strategy.

---

## 11. Exact Files Likely Touched (Implementation Phase)

| File | Change Type | Scope |
|------|------------|-------|
| `frontend/src/mathpath/fractions/fractionQuestionGenerator.js` | Modify | Add Templates A–J for F013/F014/F015 |
| `frontend/src/mathpath/fractions/fractionQuestionGenerator.test.js` | Modify | Add tests 1–6 |
| `frontend/src/mathpath/fractions/fractionQuestionFamilies.js` | Modify | Verify/update misconception tags per family |
| `frontend/src/mathpath/fractions/fractionQuestionFamilies.test.js` | Add/Modify | Add tests 7–9 |
| `services/mathpath/questionDiagramRequirementEngine.js` | Verify | Confirm F013/F014/F015 entries |
| `services/mathpath/skillVisualRequirementEngine.js` | Verify | Confirm visual requirement entries |
| `services/mathpath/misconceptionDetectionService.js` | Modify | Add wrong-answer → misconception detection rules |
| `services/mathpath/recheckRecommendationService.js` | Modify | Add misconception-specific recheck question selection |
| Related test files under `utils/` | Modify | Add tests 10–18 |

---

## 12. Safe Implementation Order

1. **Verify existing infrastructure** — Confirm F013/F014/F015 entries in skill graph, canonical map, visual engines. Fix any curriculum mapping misalignments (see section 14).
2. **Add question templates** — Implement Templates A–J in `fractionQuestionGenerator.js`. Run frontend tests.
3. **Update question families** — Ensure all 15 families have specific misconception tags. Run family tests.
4. **Enhance misconception detection** — Add wrong-answer pattern rules for new templates. Run backend tests.
5. **Wire recheck targeting** — Ensure rechecks for F013/F014/F015 misconceptions use specific strategies. Run recheck tests.
6. **Run full test suite** — All frontend + backend tests must pass before commit.
7. **Build verification** — `npm --prefix frontend run build` must succeed.

---

## 13. Non-Goals

- Dashboards, worksheets, or intervention UI changes.
- Railway config or deployment changes.
- Parent, tutor, or teacher page modifications.
- Unrelated fractions skills (F001–F012, F016–F026 unless F009 comparison is needed).
- Diagnostic engine or adaptive routing changes.
- Model drawing implementation (flagged for future sprint).
- FR3.08 number line placement (optional extension, not required).
- Database schema changes.

---

## 14. Known Issue — Curriculum Mapping Misalignment

The FRACTIONS_PILOT_INVENTORY audit flagged that `fractionCurriculumMappings.js` maps:
- F013 as "Comparing unlike fractions" (should be "Improper Fractions")
- F014 as "Ordering fractions" (should be "Mixed Numbers")
- F015 as "Adding like fractions" (should be "Convert Mixed ↔ Improper")

These **must be corrected** during implementation step 1 to ensure diagnostic placement, parent reporting, and level grouping are accurate. The fix is in `frontend/src/mathpath/curriculum/fractionCurriculumMappings.js`.

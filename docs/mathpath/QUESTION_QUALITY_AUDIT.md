# MathPath Question Quality Audit

Status: audit/report  
Scope: Tian OS MathPath, with emphasis on Fractions runtime and generated questions  
Runtime impact: none

## 1. Executive Summary

This audit reviews the current MathPath generated-question quality framework, especially the Fractions domain. It is intended to guide repair and improvement work before broader pilot use.

Current strengths:

- `F001`-`F026` remain stable runtime/reporting anchors.
- The Fractions runtime now has a stronger canonical curriculum map and runtime crosswalk.
- FR3 Mixed Numbers and Improper Fractions coverage has been expanded through the recent FR3 implementation.
- Visual requirement, misconception detection, recheck, and working-evidence services exist and can be used to improve question quality.

Current risk:

The runtime has become feature-rich, but quality must be controlled at the level of individual question families. A question can be technically generated but still be poor for learning if it is too hard, too wordy, missing a diagram, testing the wrong skill, or not linked to a meaningful remediation path.

Audit conclusion:

The platform is suitable for pilot reporting and controlled practice when question families are reviewed and quarantined where needed. It is not yet safe to claim full diagnostic/remediation precision across every Fractions skill until visual, misconception, answer-form, and word-problem schema coverage is audited per family.

## 2. Current Strengths

| Area | Current strength | Pilot value |
|---|---|---|
| Stable anchors | `F001`-`F026` provide consistent reporting IDs. | Enables parent/tutor/teacher progress tracking. |
| Curriculum mapping | Canonical, universal, primary, and Secondary 1 G1 mappings now coexist. | Supports reporting and future expansion. |
| FR3 upgrade | Mixed/improper fraction families have stronger coverage after Issue #59. | Improves an important P4 fraction bridge skill. |
| Visual metadata | Runtime has `diagramSpec`, `requiredVisualTypes`, `providedVisualTypes`, and visual coverage fields. | Enables visual-quality audit and quarantine. |
| Working evidence | Multi-step and model-heavy skills can require working. | Supports adult review and remediation. |
| Misconception services | Mistake tags and detection services exist. | Enables mistake-to-remediation routing. |
| Recheck pathway | Recheck recommendation service exists. | Allows adaptive follow-up after remediation. |

## 3. Current Risks

| Risk | Why it matters | Likely affected skills |
|---|---|---|
| Skill leakage | A question may require a later concept than the tagged skill. | F013-F022, F023-F026 |
| Missing visuals | Visual fraction skills lose meaning without diagrams. | F001-F015, F020-F026 |
| Answer-form mismatch | Student may give equivalent value but wrong required form. | F012-F015, F016-F019 |
| Weak word-problem schema | Word problems may test reading/model choice more than intended skill. | F023-F026 |
| Countable-object invalidity | Fraction of a countable set can produce non-integer answers. | F020, F023-F026 |
| Over-repetition | Generated questions may vary numbers but not thinking demand. | All generated families |
| Generic misconception tags | Tags may be too broad to route precise remediation. | F013-F026 |
| Diagram mismatch | Diagram metadata may not match the question stem or answer. | F001-F015, F023-F026 |
| Level drift | P4/P5/P6 boundaries can blur in fractions. | F013-F022 |
| Working evidence underuse | Model-heavy items may accept answer-only success. | F023-F026 |

## 4. Audit Rubric

Each generated question family should be scored 1-5 in these dimensions.

| Score | Meaning |
|---:|---|
| 1 | Unsafe: misleading, invalid, missing critical prerequisite, or wrong skill. |
| 2 | Weak: answerable but poor alignment, wording, visual support, or remediation value. |
| 3 | Usable with review: acceptable for practice but not strong enough for diagnostic claims. |
| 4 | Pilot-safe: clear, aligned, valid, and remediable. |
| 5 | Strong: high-quality diagnostic/remediation item with meaningful misconception signal. |

Dimensions:

| Dimension | Key question |
|---|---|
| Skill alignment | Does it test the intended F-code / micro-skill? |
| Level fit | Is it suitable for the tagged level? |
| Mathematical validity | Is the answer valid, unambiguous, and in the requested form? |
| Wording clarity | Is the stem clear and student-friendly? |
| Visual support | Are required diagrams present and appropriate? |
| Misconception usefulness | Does a wrong answer reveal a meaningful error pattern? |
| Remediation readiness | Can the error route to useful teaching and recheck? |

Classification:

| Classification | Rule of thumb |
|---|---|
| Pilot-safe | No dimension below 4, or only low-risk wording issue. |
| Needs review | Any dimension at 3, or minor metadata/visual weakness. |
| Quarantine/fix | Any dimension at 1-2, missing critical diagram, invalid answer, or wrong-skill mapping. |

## 5. Per-Skill Risk Table for `F001`-`F026`

| F-code | Current topic | Main risk | Diagram/model need | Misconception need | Pilot status | Notes |
|---|---|---|---|---|---|---|
| F001 | Fractional parts | Equal/unequal parts not shown clearly | Required: shaded/equal-part model | unequal_parts, wrong_whole_identified | Pilot-safe with visual audit | Must not accept unequal partitions as valid fractions. |
| F002 | Numerator/denominator meaning | Vocabulary without concept | Required/strongly useful | numerator_denominator_confusion | Pilot-safe with review | Needs prompts that test meaning, not labels only. |
| F003 | Fractions from shapes/sets | Wrong whole in set/area models | Required | wrong_whole_identified | Pilot-safe with review | Set fractions must define the whole clearly. |
| F004 | Unit fractions | Denominator-size misconception | Required/strongly useful | unit_fraction_confusion | Pilot-safe | Good fluency candidate after concept. |
| F005 | Number lines | Counting tick marks instead of intervals | Required | number_line_partition_error | Needs review | Number-line rendering must be precise. |
| F006 | Compare unit fractions | Rule memorisation without meaning | Useful | compares_denominator_only | Pilot-safe with review | Visual support useful for weak learners. |
| F007 | Same denominator comparison | Low risk | Optional/useful | compares_numerator_only | Pilot-safe | Good fluency candidate. |
| F008 | Same numerator comparison | Counter-intuitive denominator reasoning | Useful | compares_denominator_only | Needs review | Must avoid reinforcing “larger denominator means larger value.” |
| F009 | Order fractions | Common-denominator / benchmark complexity | Useful | benchmark_error, no_common_denominator | Needs review | Level-fit important. |
| F010 | Equivalent fractions | Scaling without meaning | Useful | equivalent_fraction_scaling_error | Pilot-safe with review | Needs visual and symbolic forms. |
| F011 | Generate equivalents | Missing-term scaling errors | Optional/useful | equivalent_fraction_scaling_error | Pilot-safe with review | Watch for too many similar fill-in templates. |
| F012 | Simplest form | Final answer not simplified | Optional | not_simplified | Pilot-safe with review | Answer-form checking is essential. |
| F013 | Improper fractions | Diagram/answer-form mismatch | Required for visual variants | improper_fraction_conversion_error | Pilot-safe after FR3 review | Should include count-all-unit-parts variants. |
| F014 | Mixed numbers | Ignoring whole number or fraction part | Required for visual variants | mixed_number_conversion_error | Pilot-safe after FR3 review | Should distinguish interpretation vs conversion. |
| F015 | Mixed ↔ improper conversion | Reversed quotient/remainder; wrong answer form | Useful/required for visual variants | mixed_number_conversion_error, improper_fraction_conversion_error | Pilot-safe after FR3 review | Strong answer-form metadata required. |
| F016 | Add like fractions | Adds denominators | Optional/useful | adds_denominators | Pilot-safe with review | Watch answer-form if result is improper. |
| F017 | Subtract like fractions | Subtracts denominators / wrong remaining part | Optional/useful | subtracts_denominators | Pilot-safe with review | Working may be useful. |
| F018 | Add unlike fractions | No common denominator | Useful | no_common_denominator, adds_denominators | Needs review | Level-fit and simplification checks important. |
| F019 | Subtract unlike fractions | No common denominator / regrouping | Useful | no_common_denominator, regrouping_error | Needs review | Regrouping should not appear before taught. |
| F020 | Fraction of quantity | Countable-object invalidity | Useful/required | fraction_of_quantity_unit_error | Needs review | Must enforce integer-safe countable contexts. |
| F021 | Multiply fractions | Procedure without meaning | Useful | wrong_operation, not_simplified | Needs review | Visual “of a fraction” is important. |
| F022 | Divide fractions | Reciprocal misuse | Useful | reciprocal_error | Needs review | Context decides whether quotient is count, measure, or fraction. |
| F023 | Fraction word problems | Wrong schema / too much reading load | Bar/model often required | wrong_operation, weak_bar_model | Needs review | Must separate arithmetic from schema comprehension. |
| F024 | Multi-step word problems | Stops after first step / remainder errors | Model required | ignores_remainder, stops_after_first_step | Needs review / quarantine for weak families | Requires working evidence. |
| F025 | Exam applications | Mixed-topic leakage | Model often required | mixed_error_pattern | Needs review | Good for assessment, not first-line remediation. |
| F026 | Mastery challenge | Too broad for precise remediation | Model often required | repeated_error, mixed_error_pattern | Needs review | Should remain reporting/mastery anchor. |

## 6. FR3 / F013-F015 Special Review

FR3 now has improved runtime support through the recent implementation.

Expected FR3 quality checks:

| FR micro-skill | Runtime anchor | Quality expectation | Risk to audit |
|---|---|---|---|
| FR3.01 | F013 | Interpret improper fractions as more than one whole. | Does prompt require mixed-number conversion too early? |
| FR3.02 | F013 | Represent/count improper fractions in visual models. | Does diagram show equal-sized wholes? |
| FR3.03 | F014 | Interpret mixed number as whole plus fraction. | Does student know which part is whole and which is fraction? |
| FR3.04 | F014 | Represent mixed numbers visually. | Does diagram use same-sized wholes? |
| FR3.05 | F015 | Convert improper to mixed using division. | Does answer form require mixed number clearly? |
| FR3.06 | F015 | Convert mixed to improper. | Are common wrong answers distinguishable? |
| FR3.07 | F015/F009 | Compare mixed and improper fractions. | Does it require conversion or visual comparison? |

FR3 should be reviewed with special attention to:

- denominator consistency across all wholes,
- answer-form metadata,
- mixed-number input tools,
- visual model rendering,
- accepted answers not being too permissive,
- misconception tags specific enough to distinguish ignored whole, wrong denominator, and answer-form mismatch.

## 7. Top 20 Question-Quality Risks

1. Visual question generated without a diagram.
2. Diagram generated but not matching the stem.
3. Fraction bars using unequal wholes or unclear part sizes.
4. Number-line questions counting tick marks instead of intervals.
5. Mixed-number question accepting improper fraction when mixed number is required.
6. Improper-fraction question accepting mixed number when answer form is explicitly improper.
7. Simplification question accepting unsimplified final answer.
8. P4 item using P5/P6 operation complexity.
9. Unlike-denominator operations appearing before common-denominator readiness.
10. Countable-object word problem producing fractional people/items.
11. Word problem contains too much language for the skill being tested.
12. Repeated templates vary only numbers but not reasoning.
13. Distractors are random rather than misconception-based.
14. Mistake tags are generic and do not support targeted remediation.
15. Recheck item repeats the same surface form too closely.
16. Question tests multiple skills but records only one skill.
17. Working evidence not required for bar-model/schema questions.
18. Prompt asks for “which is greater” but answer is symbol-only or mismatched input type.
19. Accepted answers are too broad and hide answer-form errors.
20. Question context is mathematically valid but unrealistic for Primary level.

## 8. Recommended Quarantine Rules

Question families or generated items should be quarantined before pilot if any of the following are true:

- denominator is zero or invalid,
- no unique correct answer exists,
- visual item has no diagram,
- diagram data contradicts prompt or answer,
- countable-object answer is not a whole number,
- primary-level item includes negative fractions unless explicitly allowed by the curriculum slice,
- mixed/improper item accepts the wrong answer form when the form is being tested,
- word problem requires more than the tagged skill without marking it as multi-step,
- model-heavy item has no working evidence requirement,
- prompt contains placeholder/developer wording.

## 9. Recommended First Repair Slices

### Slice 1 — Visual/diagram audit for F013-F015

Reason: FR3 was recently upgraded and is a high-value bridge topic. Confirm diagrams, answer forms, and misconception tags before expanding further.

Likely files:

```text
frontend/src/mathpath/fractions/fractionQuestionGenerator.js
frontend/src/mathpath/fractions/fractionQuestionGenerator.test.js
services/mathpath/questionDiagramRequirementEngine.js
services/mathpath/skillVisualRequirementEngine.js
services/mathpath/visualQualityAuditService.js
```

### Slice 2 — Answer-form mismatch audit for F012-F019

Reason: simplification, mixed number, improper fraction, and addition/subtraction items are especially vulnerable to equivalent-value but wrong-form answers.

### Slice 3 — Countable-object validity audit for F020/F023-F026

Reason: word problems involving people/items/stickers must not create fractional counts unless the context is continuous.

### Slice 4 — Word-problem schema audit for F023-F026

Reason: these skills need model drawing and schema classification, not just arithmetic answer checking.

### Slice 5 — Level-fit audit for P4/P5/P6 fractions

Reason: fractions vertical now spans primary and Secondary 1 G1 mappings; generated difficulty must respect level boundaries.

## 10. Next Implementation Prompt

Use this prompt for the first repair slice:

```text
Implement Question Quality Repair Slice 1: Visual/diagram audit for F013-F015.

Current stable base:
- GitHub CI is green.
- Railway backend is healthy.
- FR3 Mixed/Improper Fractions runtime coverage is implemented.
- Do not touch unrelated skills or dashboards.

Goal:
Ensure F013/F014/F015 generated question families have correct visual/diagram metadata, answer-form checks, and misconception routing.

Scope:
- F013 Improper Fractions
- F014 Mixed Numbers
- F015 Convert Mixed ↔ Improper

Tasks:
1. Generate representative questions for each F013/F014/F015 family.
2. Verify which families require diagrams.
3. Ensure required visual types match provided diagramSpec.
4. Add/repair tests for visualCoverageStatus.
5. Confirm mixed/improper answer form metadata.
6. Confirm misconception tags for:
   - wrong_whole_identified
   - improper_fraction_conversion_error
   - mixed_number_conversion_error
   - answer_form_mismatch
   - not_simplified

Run:
npm --prefix frontend test -- fractionQuestionGenerator
npm test -- \
  utils/questionDiagramRequirementEngine.test.js \
  utils/skillVisualRequirementEngine.test.js \
  utils/visualQualityAuditService.test.js
npm --prefix frontend test
npm --prefix frontend run build

Do not commit until tests pass.
Return files changed, tests run, and exact git add command.
```

## 11. Pilot Safety Recommendation

Use current question generation for pilot only with guardrails:

- Keep F001-F026 as reporting anchors.
- Treat FR micro-skills as internal precision taxonomy, not student-facing labels.
- Prefer reviewed question families for diagnostics.
- Use generated questions for practice, but quarantine families with missing visual/answer-form metadata.
- Require working evidence for model-heavy word problems.
- Avoid strong claims about full remediation precision until F023-F026 schema coverage is audited.

## 12. Audit Conclusion

The current question system is strong enough to support a controlled pilot, but the next quality step should be a family-level audit rather than broad feature expansion.

Highest-value next repair:

```text
Visual/diagram + answer-form audit for F013-F015 after FR3 implementation.
```

This is narrow, high-value, and directly improves the newest Fractions runtime slice.

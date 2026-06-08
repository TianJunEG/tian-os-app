# P1-NUM Foundation Implementation Spec

Status: implementation planning reference  
Scope: Tian OS MathPath Primary 1 Numbers foundation  
Runtime impact: none

## 1. Executive Summary

`P1-NUM` should be the first Primary 1 runtime slice because number sense is the foundation for every later Primary 1 topic: addition, subtraction, money, measurement, picture graphs, and word problems.

This implementation spec prepares a future runtime task. It does not change runtime code, seed data, question generators, tests, or deployment configuration.

The first runtime version should keep the slice small and focus on the foundations students must have before P1 addition/subtraction becomes meaningful:

```text
P1-NUM-01 Count objects accurately
P1-NUM-02 Match number to quantity
P1-NUM-03 Read and write numerals to 20
P1-NUM-04 Count forward and backward
P1-NUM-05 Compare numbers
P1-NUM-06 Order numbers
P1-NUM-07 Before, after, and between
P1-NUM-08 Number bonds within 10
P1-NUM-09 Number bonds within 20
P1-NUM-10 Tens and ones
P1-NUM-11 Count in tens and ones
```

Primary 1 number work requires strong visual support. Object pictures, ten frames, number lines, number bond diagrams, and base-ten blocks should be treated as core learning assets rather than decorative diagrams.

## 2. Runtime Design Proposal

Future implementation should introduce Primary 1 as a separate runtime area rather than forcing P1 topics into the current Fractions runtime.

Suggested future files:

```text
frontend/src/mathpath/primary/p1SkillGraph.js
frontend/src/mathpath/primary/p1QuestionFamilies.js
frontend/src/mathpath/primary/p1QuestionGenerator.js
frontend/src/mathpath/primary/p1QuestionGenerator.test.js
frontend/src/mathpath/primary/p1MisconceptionMap.js
frontend/src/mathpath/primary/p1VisualModels.js
```

Backend/shared services can reuse existing MathPath concepts where suitable:

```text
services/mathpath/skillDisplayNameService.js
services/mathpath/questionSkillIntegrityService.js
services/mathpath/recheckRecommendationService.js
services/mathpath/visualQualityAuditService.js
```

A separate visual requirement engine may be useful later:

```text
services/mathpath/primaryVisualRequirementEngine.js
```

However, the first implementation should prefer reuse unless current visual services cannot represent object-counting, ten-frame, number-line, and base-ten models cleanly.

Future diagnostic domain registration should be considered only after the P1 skill graph and generator are stable. The initial implementation can begin as hidden/dev-preview content.

## 3. P1-NUM Skill Table

| Skill ID | Runtime title | Student label | Parent label | Concept | Prerequisite | Diagnostic purpose | Practice template types | Fluency suitability | Visual requirement | Remediation route | Recheck pattern | Misconception tags |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P1-NUM-01 | Count objects accurately | Count objects | Counting one-by-one accurately | Count each object once; final count is total. | Oral counting sequence | Detect one-to-one correspondence and cardinality. | Object counting, scattered set counting, arranged set counting | Yes after accuracy | Required: object pictures | Point/cross-out counting scaffold | New object set with different arrangement | counting_skip_object, counting_double_count, cardinality_not_understood |
| P1-NUM-02 | Match number to quantity | Match number and amount | Connect numerals to quantities | A numeral represents a quantity. | P1-NUM-01 | Detect symbol-quantity mismatch. | Choose group matching numeral, choose numeral matching group | Yes | Required: object groups | Count each group, then match total to numeral | Same numeral with different layout | number_symbol_quantity_mismatch, counting_skip_object |
| P1-NUM-03 | Read and write numerals to 20 | Read and write numbers | Numeral recognition to 20 | Recognise and write numerals including teen numbers. | Number recognition to 10 | Detect digit reversal and teen confusion. | Write numeral from word, choose numeral from spoken/written word | Yes | Optional; ten-frame useful for teens | Tens-and-ones language for teen numbers | New teen number | digit_reversal, teen_number_confusion |
| P1-NUM-04 | Count forward and backward | Count on and back | Flexible counting sequence | Continue counting from a given number. | P1-NUM-01 | Detect sequence gaps and dependence on starting at 1. | Count on, count back, fill missing sequence | Strong yes | Optional number line | Count from the given number, not from 1 | New starting number | counting_sequence_gap, before_after_confusion |
| P1-NUM-05 | Compare numbers | More or fewer | Compare number size | Decide greater, smaller, or same. | P1-NUM-02 | Detect magnitude comparison weakness. | Compare two numerals, compare two object groups | Yes | Optional; required for weak learners | Use objects or number line to compare | New pair of numbers | compares_by_digit_shape, number_symbol_quantity_mismatch |
| P1-NUM-06 | Order numbers | Put numbers in order | Order numbers by size | Arrange numbers smallest to greatest or greatest to smallest. | P1-NUM-05 | Detect sequencing and multi-number comparison gaps. | Order three numbers, choose missing ordered number | Yes | Optional number line | Place numbers on number line before ordering | New three-number set | counting_sequence_gap, compares_by_digit_shape |
| P1-NUM-07 | Before, after, and between | Before, after, between | Neighbouring numbers | Identify nearby numbers in counting sequence. | P1-NUM-04 | Detect sequence flexibility. | Before, after, between, missing neighbour | Strong yes | Optional number line | Count on/back around the target | New target number | before_after_confusion, counting_sequence_gap |
| P1-NUM-08 | Number bonds within 10 | Make 10 and smaller bonds | Part-whole bonds within 10 | Split a number into two parts. | P1-NUM-01 | Detect part-whole understanding. | Missing part, number bond diagram, ten-frame bond | Strong yes | Useful; ten-frame/number bond diagram | Cover known part and count missing part | New bond within 10 | number_bond_missing_part_error, count_all_instead_of_count_on |
| P1-NUM-09 | Number bonds within 20 | Bonds to 20 | Part-whole bonds within 20 | Compose/decompose numbers up to 20. | P1-NUM-08 | Detect extension of bond reasoning into teen numbers. | 10 + missing, teen decomposition, missing addend | Yes after concept | Useful; ten-frame/base-ten | Use 10-and-some-more structure | New teen bond | teen_number_confusion, number_bond_missing_part_error |
| P1-NUM-10 | Tens and ones | Tens and ones | Place value foundation | Two-digit numbers are made of tens and ones. | Counting to 20/100 | Detect place-value understanding. | Identify tens/ones, build number from blocks | Later | Required: base-ten blocks/tens bundles | Bundle tens and count loose ones | New two-digit number | tens_ones_reversal, place_value_digit_error |
| P1-NUM-11 | Count in tens and ones | Build numbers with tens and ones | Combine tens and ones | Count grouped tens and leftover ones. | P1-NUM-10 | Detect whether child can combine tens and ones into a numeral. | Tens-and-ones to numeral, numeral to tens-and-ones | Yes after concept | Required: base-ten blocks/tens bundles | Say: 4 tens is 40, plus 3 ones is 43 | New tens/ones model | tens_ones_reversal, place_value_digit_error |

## 4. Question Template Specification

### P1-NUM-01 — Object counting

| Field | Specification |
|---|---|
| Prompt pattern | `Count the {objects}. How many {objects} are there?` |
| Example | `Count the stars. How many stars are there?` |
| Answer type | whole number |
| Example answer | `7` |
| Visual requirement | object picture required |
| Allowed input | whole number buttons / numeric input |
| Fluency mode | yes after concept is secure |
| Misconception traps | scattered layout, different spacing, similar-looking objects |

### P1-NUM-02 — Numeral-to-quantity matching

| Field | Specification |
|---|---|
| Prompt pattern | `Which group shows {number} {objects}?` |
| Example | `Which group shows 8 apples?` |
| Answer type | selected option |
| Example answer | option with 8 objects |
| Visual requirement | multiple object groups required |
| Allowed input | multiple choice / tap group |
| Fluency mode | yes |
| Misconception traps | group with larger spacing, group with one more/one fewer object |

### P1-NUM-03 — Read and write numerals to 20

| Field | Specification |
|---|---|
| Prompt pattern | `Write the number {numberWord}.` |
| Example | `Write the number twelve.` |
| Answer type | whole number |
| Example answer | `12` |
| Visual requirement | optional; ten-frame useful for support |
| Allowed input | whole number input |
| Fluency mode | yes |
| Misconception traps | reversed digits, teen-number distractors |

### P1-NUM-04 — Count on / count back

| Field | Specification |
|---|---|
| Prompt pattern | `Count on from {start}: {start}, ___, ___, ___.` |
| Example | `Count on from 14: 14, 15, 16, ___.` |
| Answer type | whole number or sequence |
| Example answer | `17` |
| Visual requirement | optional number line |
| Allowed input | whole number / sequence input |
| Fluency mode | strong yes |
| Misconception traps | restarts from 1, skips teen numbers |

### P1-NUM-05 — Compare numbers

| Field | Specification |
|---|---|
| Prompt pattern | `Which number is greater: {a} or {b}?` |
| Example | `Which number is greater: 14 or 17?` |
| Answer type | whole number / choice |
| Example answer | `17` |
| Visual requirement | optional number line or objects |
| Allowed input | choice / whole number |
| Fluency mode | yes |
| Misconception traps | numbers with same tens, teen reversal, visually larger distractor |

### P1-NUM-06 — Order three numbers

| Field | Specification |
|---|---|
| Prompt pattern | `Put these numbers from smallest to greatest: {a}, {b}, {c}.` |
| Example | `Put these numbers from smallest to greatest: 12, 8, 15.` |
| Answer type | ordering/list |
| Example answer | `8, 12, 15` |
| Visual requirement | optional number line |
| Allowed input | drag/drop or ordered list |
| Fluency mode | yes after comparison is secure |
| Misconception traps | keeps original order, sorts by first digit only |

### P1-NUM-07 — Before / after / between

| Field | Specification |
|---|---|
| Prompt pattern | `What number comes after {n}?` / `What number is between {a} and {b}?` |
| Example | `What number is between 13 and 15?` |
| Answer type | whole number |
| Example answer | `14` |
| Visual requirement | optional number line |
| Allowed input | whole number |
| Fluency mode | strong yes |
| Misconception traps | before/after reversal, count sequence gap |

### P1-NUM-08 — Number bonds within 10

| Field | Specification |
|---|---|
| Prompt pattern | `Complete: {whole} = {part} + ___.` |
| Example | `Complete: 7 = 5 + ___.` |
| Answer type | whole number |
| Example answer | `2` |
| Visual requirement | number bond diagram or counters useful |
| Allowed input | whole number |
| Fluency mode | strong yes after concept |
| Misconception traps | gives whole, gives known part, counts all again |

### P1-NUM-09 — Number bonds within 20

| Field | Specification |
|---|---|
| Prompt pattern | `Complete: {teen} = 10 + ___.` |
| Example | `Complete: 14 = 10 + ___.` |
| Answer type | whole number |
| Example answer | `4` |
| Visual requirement | ten-frame/base-ten support useful |
| Allowed input | whole number |
| Fluency mode | yes after concept |
| Misconception traps | writes 14, writes 10, digit reversal |

### P1-NUM-10 — Tens and ones

| Field | Specification |
|---|---|
| Prompt pattern | `How many tens and ones are in {number}?` |
| Example | `How many tens and ones are in 34?` |
| Answer type | structured response: tens, ones |
| Example answer | `3 tens and 4 ones` |
| Visual requirement | base-ten blocks required for early learners |
| Allowed input | structured whole-number fields or multiple choice |
| Fluency mode | later |
| Misconception traps | reverses tens/ones, adds digits |

### P1-NUM-11 — Tens-and-ones to numeral

| Field | Specification |
|---|---|
| Prompt pattern | `There are {tens} tens and {ones} ones. What number is it?` |
| Example | `There are 4 tens and 3 ones. What number is it?` |
| Answer type | whole number |
| Example answer | `43` |
| Visual requirement | base-ten blocks required for early learners |
| Allowed input | whole number |
| Fluency mode | yes after concept |
| Misconception traps | answers 7, answers 34, reverses digits |

## 5. Visual Requirements

| Visual type | Used for | Required for first runtime slice? | Notes |
|---|---|---|---|
| Object pictures | Counting, quantity matching | Yes | Must support scattered and arranged layouts. |
| Ten frames | Number bonds, teen numbers | Recommended | Useful for making 10 and 10-plus facts visible. |
| Number lines | Count on/back, before/after/between, comparison/order | Optional but useful | Especially helpful for weak learners. |
| Base-ten blocks / tens bundles | Tens and ones | Yes for P1-NUM-10/11 | Must show bundles of ten and loose ones clearly. |
| Number bond diagrams | Number bonds within 10/20 | Recommended | Helpful for remediation and parent explanation. |
| Selectable groups | Quantity matching | Yes | Needed for multiple-choice visual questions. |

Visuals should be generated originally by Tian OS. They should not copy textbook or third-party worksheet images.

## 6. Misconception Tags

Stable tags proposed for P1-NUM:

```text
counting_skip_object
counting_double_count
cardinality_not_understood
number_symbol_quantity_mismatch
digit_reversal
teen_number_confusion
counting_sequence_gap
before_after_confusion
compares_by_digit_shape
count_all_instead_of_count_on
number_bond_missing_part_error
tens_ones_reversal
place_value_digit_error
```

## 7. Remediation and Recheck Rules

| Misconception tag | What the child likely did | Remediation explanation | Visual scaffold | Recheck pattern | Parent/tutor note |
|---|---|---|---|---|---|
| counting_skip_object | Missed one or more objects while counting | Count slowly and touch each object once. | Object set with cross-out marks | New set with same count but new layout | Watch the pointing path. |
| counting_double_count | Counted the same object more than once | Mark each object after counting it. | Object set with check marks | New scattered set | Encourage organised counting direction. |
| cardinality_not_understood | Counted correctly but did not know last number is total | The last number said tells how many altogether. | Object row with final count highlighted | Ask “How many altogether?” after counting | Do not stop at recitation. |
| number_symbol_quantity_mismatch | Could not match numeral to amount | Count the group, then match the total to the numeral. | Object groups and numeral card | Same numeral, new object groups | Use real-life matching games. |
| digit_reversal | Wrote/read 12 as 21 or similar | Read tens first, then ones. | Tens-and-ones cards | New teen/two-digit number | Common but should be tracked. |
| teen_number_confusion | Confused 13-19 vocabulary | Teen numbers are 10 and some more. | Ten-frame plus extra ones | New teen decomposition | Say “10 and 4 is 14.” |
| counting_sequence_gap | Skipped number in sequence | Practise counting on/back from different starts. | Number line | Fill missing sequence | Avoid always starting at 1. |
| before_after_confusion | Reversed before/after | Use number line arrows: before is left/back, after is right/forward. | Number line | New before/after item | Use daily language: before lunch, after lunch. |
| compares_by_digit_shape | Chose number by appearance or first digit | Use number line or objects to compare size. | Number line/object sets | New comparison pair | Ask which number comes later when counting. |
| count_all_instead_of_count_on | Always restarted counting from 1 | Start from the larger number and count on. | Number line jumps | New count-on addition/sequence | Supports later addition fluency. |
| number_bond_missing_part_error | Did not find missing part | Whole is made of two parts; cover known part and count missing. | Number bond diagram/counters | New bond with same whole | Foundational for addition/subtraction. |
| tens_ones_reversal | Reversed tens and ones | Tens are bundles of 10; ones are loose pieces. | Base-ten blocks | New two-digit number | Ask child to build the number. |
| place_value_digit_error | Added digits or treated digits separately | 4 tens means 40, not 4. | Tens bundles and ones | New tens-and-ones model | Important before two-digit operations. |

## 8. Diagnostic Flow Proposal

A future adaptive diagnostic should begin concretely and only move upward when foundations are stable.

Recommended sequence:

1. Count objects accurately.
2. Match number to quantity.
3. Read/write numerals to 20.
4. Count forward and backward from a given number.
5. Compare two numbers.
6. Order three numbers.
7. Before/after/between.
8. Number bonds within 10.
9. Number bonds within 20.
10. Tens and ones.
11. Count in tens and ones.

Fallback rules:

- If object counting fails, do not test place value yet. Route to counting scaffold.
- If symbol/quantity matching fails, route to object counting plus numeral recognition.
- If count-on/count-back fails, route to number-line sequence practice.
- If compare/order fails, use object sets and number line before symbolic numbers.
- If number bonds fail, route to part-whole counters and ten-frame remediation.
- If tens/ones fails, use base-ten bundles before symbolic place value.

## 9. First Implementation Slice Recommendation

### P1-NUM Runtime Slice A

The first coding slice should not implement all 11 skills at once.

Recommended first slice:

```text
P1-NUM-01 Count objects accurately
P1-NUM-02 Match number to quantity
P1-NUM-03 Read and write numerals to 20
P1-NUM-04 Count forward and backward
P1-NUM-05 Compare numbers
P1-NUM-06 Order numbers
```

### Why stop at P1-NUM-06 first

These skills establish counting, symbol-quantity matching, sequence, and comparison. They are enough to create a useful diagnostic and practice loop without immediately introducing number bonds and place value, which require more careful remediation and visual scaffolds.

### Likely files touched later

```text
frontend/src/mathpath/primary/p1SkillGraph.js
frontend/src/mathpath/primary/p1QuestionFamilies.js
frontend/src/mathpath/primary/p1QuestionGenerator.js
frontend/src/mathpath/primary/p1QuestionGenerator.test.js
frontend/src/mathpath/primary/p1VisualModels.js
services/mathpath/primaryVisualRequirementEngine.js
```

### Tests to add later

- P1 skill graph defines stable IDs and friendly labels.
- P1 generator creates object-counting questions with valid integer answers.
- Quantity matching questions include correct and near-miss distractors.
- Count-on/count-back questions do not always start from 1.
- Compare/order questions respect numeric value.
- Visual requirement engine requires object pictures for counting/matching.
- Misconception tags are attached to generated question families.

### User-facing risk

Low if hidden behind a feature flag or admin/dev preview. Medium if exposed to students before visual rendering and answer input are validated.

### Rollout suggestion

Start behind a feature flag or hidden preview route, for example:

```text
VITE_ENABLE_PRIMARY_MATH_PREVIEW
```

No parent/tutor/teacher dashboard claims should be made until diagnostic and progress reporting are implemented.

## 10. Validation Checklist for Future Runtime Task

Future runtime implementation should run focused tests first:

```bash
npm --prefix frontend test -- p1QuestionGenerator
npm test -- primaryVisualRequirementEngine
npm --prefix frontend run build
```

After stable local tests, run full CI:

```bash
npm test
npm --prefix frontend test
npm --prefix frontend run build
```

## Final implementation boundary

This file is a planning artefact only. It should guide a future implementation issue but should not be imported by runtime code.

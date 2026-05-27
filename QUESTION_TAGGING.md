# QUESTION_TAGGING.md — MathPath Question Tagging Standard

The contract every MathPath question (generated or authored) must satisfy. Where
[`SKILL.md`](./SKILL.md) defines **what is taught and in what order** (the skill graph), this
document defines **how an individual question attaches to that graph** so the generator,
auto-marker, mastery tracker, and remediation engine all read the same fields.

> Every question is an instance of exactly one `skill_id`. Its `domain`, `level_tag`, and
> `fluency_type` MUST match that skill's node in `SKILL.md §1.1`; its `prerequisite_skill_ids`
> and `remediation_skill_ids` MUST be consistent with the edge list in `SKILL.md §4.1`.

---

## 1. Question Schema

| Field | Type | Purpose / allowed values |
| --- | --- | --- |
| `question_id` | string | Stable unique key, `<skill_id>-q<n>` e.g. `mul-tables-6789-q0017`. |
| `skill_id` | string | The single skill this question assesses (key into `SKILL.md §3`). |
| `domain` | enum | Owning domain `D1`–`D11`; must equal the skill's domain. |
| `level_tag` | enum | `P1`–`P6` \| `S1`–`S4`; must equal (or fall within) the skill's `level_tag`. |
| `difficulty` | int | `1`–`5`: `1` entry/scaffolded · `2` foundational · `3` core/at-level · `4` stretch · `5` challenge. |
| `estimated_time_seconds` | number | Expected first-try time for this item; anchored to the skill's `expected_time_seconds`, scaled by `difficulty`. |
| `fluency_type` | enum | `fact_recall` \| `procedural` \| `strategic` \| `none`; must equal the skill's `fluency_type`. |
| `question_type` | enum | `numeric_entry` \| `multiple_choice` \| `fill_blank` \| `multi_step`. |
| `answer` | object | `{ value, accepted? , unit? }` — canonical answer plus any equivalent accepted forms. |
| `worked_solution` | string[] | Ordered solution steps, shown after an attempt or on request. |
| `hint_sequence` | string[] | Progressive hints, least→most revealing; a hinted item never counts toward fluency. |
| `misconception_tags` | string[] | Slugs of the errors a wrong answer maps to; namespaced `<domain-slug>/<error>`. Must be drawn from the skill's `common_misconceptions`. |
| `prerequisite_skill_ids` | string[] | Skills assumed mastered (incoming edges in `SKILL.md §4.1`). |
| `remediation_skill_ids` | string[] | Where to route on failure — the prerequisite(s) the remediation engine reteaches (`SKILL.md §8` chains). |

### Enumerations

- **`difficulty`** — `1` (entry, scaffolded) · `2` (foundational) · `3` (core, at grade level) · `4` (stretch) · `5` (challenge).
- **`fluency_type`** — `fact_recall` (single recalled fact) · `procedural` (a learned procedure) · `strategic` (multi-step planning) · `none` (pure concept, untimed-leaning).
- **`question_type`** — `numeric_entry` · `multiple_choice` · `fill_blank` · `multi_step`.
- **`misconception_tags`** — slug per skill domain, e.g. `mult/adjacent-fact-slip`, `frac/add-denominators`, `pct/answer-is-percent`.

### Consistency rules

1. `domain`, `level_tag`, and `fluency_type` are **copied from** the skill node — they are not chosen per question.
2. `misconception_tags` must each correspond to one of the skill's `common_misconceptions`.
3. `remediation_skill_ids` ⊆ the transitive prerequisites of `skill_id` in `SKILL.md §4.1`.
4. A question carrying any `hint_sequence` entry that was used does **not** count toward fluency (mastery rule, `SKILL.md §1`).

---

## 2. Reusable Template

```yaml
- question_id: ""                    # "<skill_id>-q<n>"
  skill_id: ""                       # key into SKILL.md §3
  domain: ""                         # must equal skill.domain
  level_tag: ""                      # must equal skill.level_tag
  difficulty: 0                      # 1–5
  estimated_time_seconds: 0
  fluency_type: ""                   # fact_recall | procedural | strategic | none
  question_type: ""                  # numeric_entry | multiple_choice | fill_blank | multi_step
  prompt: ""                         # the rendered question text
  answer:
    value: ""                        # canonical answer
    accepted: []                     # equivalent accepted forms
    unit: null
  worked_solution: []                # [step, …]
  hint_sequence: []                  # [least-revealing, …, most-revealing]
  misconception_tags: []             # slugs drawn from skill.common_misconceptions
  prerequisite_skill_ids: []         # incoming edges (SKILL.md §4.1)
  remediation_skill_ids: []          # reteach targets on failure (SKILL.md §8)
```

---

## 3. Example Questions

### Multiplication fluency

```yaml
- question_id: "mul-tables-6789-q0017"
  skill_id: "mul-tables-6789"
  domain: "D3 · Multiplication & Division"
  level_tag: "P3"
  difficulty: 2
  estimated_time_seconds: 4
  fluency_type: "fact_recall"
  question_type: "numeric_entry"
  prompt: "7 × 8 = ?"
  answer:
    value: 56
    accepted: ["56"]
    unit: null
  worked_solution:
    - "Recall the fact directly: 7 × 8 = 56."
    - "Check: 7 × 8 = 7 × 4 × 2 = 28 × 2 = 56."
  hint_sequence:
    - "It's one of the 7 or 8 times-table facts — try to recall it."
    - "7 × 8 sits between 7 × 7 = 49 and 7 × 9 = 63."
    - "7 × 8 = (7 × 4) × 2 = 28 × 2."
  misconception_tags:
    - "mult/adjacent-fact-slip"     # answers 49 or 63
    - "mult/adds-instead-of-multiplies"  # answers 15
  prerequisite_skill_ids: ["mul-tables-346"]
  remediation_skill_ids: ["mul-tables-346", "mul-tables-2510"]
```

### Equivalent fractions

```yaml
- question_id: "frac-equiv-q0042"
  skill_id: "frac-equiv"
  domain: "D4 · Fractions"
  level_tag: "P3"
  difficulty: 3
  estimated_time_seconds: 12
  fluency_type: "procedural"
  question_type: "fill_blank"
  prompt: "Fill in the box:  3/4 = ☐/12"
  answer:
    value: 9
    accepted: ["9", "9/12"]
    unit: null
  worked_solution:
    - "Find how the denominator scaled: 12 ÷ 4 = 3."
    - "Scale the numerator by the same factor: 3 × 3 = 9."
    - "So 3/4 = 9/12."
  hint_sequence:
    - "What do you multiply 4 by to get 12?"
    - "Whatever you do to the denominator, do the same to the numerator."
    - "4 × 3 = 12, so multiply the top by 3 too."
  misconception_tags:
    - "frac/add-not-multiply"        # 3+8 → 11
    - "frac/scales-one-part-only"    # leaves numerator as 3
  prerequisite_skill_ids: ["frac-half-quarter", "mul-tables-6789", "num-factors"]
  remediation_skill_ids: ["mul-tables-6789", "frac-half-quarter"]
```

### Percentage of a quantity

```yaml
- question_id: "pct-of-quantity-q0008"
  skill_id: "pct-of-quantity"
  domain: "D6 · Percentage"
  level_tag: "P5"
  difficulty: 3
  estimated_time_seconds: 15
  fluency_type: "procedural"
  question_type: "numeric_entry"
  prompt: "What is 20% of 50?"
  answer:
    value: 10
    accepted: ["10"]
    unit: null
  worked_solution:
    - "20% = 20/100 = 0.2."
    - "0.2 × 50 = 10."
    - "Or: 10% of 50 = 5, so 20% = 2 × 5 = 10."
  hint_sequence:
    - "20% means 20 out of every 100."
    - "Convert the percent to a fraction or decimal first: 20% = 1/5."
    - "Now find 1/5 of 50."
  misconception_tags:
    - "pct/answer-is-percent"        # answers 20
    - "pct/divides-by-percent"       # answers 50 ÷ 20 = 2.5
    - "pct/decimal-misplace"         # answers 100
  prerequisite_skill_ids: ["pct-meaning", "frac-of-quantity"]
  remediation_skill_ids: ["frac-of-quantity", "pct-meaning"]
```

### Simple algebra

```yaml
- question_id: "alg-linear-eq-q0003"
  skill_id: "alg-linear-eq"
  domain: "D8 · Algebra"
  level_tag: "S1"
  difficulty: 3
  estimated_time_seconds: 40
  fluency_type: "strategic"
  question_type: "numeric_entry"
  prompt: "Solve for x:  2x + 3 = 11"
  answer:
    value: 4
    accepted: ["4", "x=4"]
    unit: null
  worked_solution:
    - "Subtract 3 from both sides: 2x = 8."
    - "Divide both sides by 2: x = 4."
    - "Check: 2(4) + 3 = 11. ✓"
  hint_sequence:
    - "Get the x-term alone on one side first."
    - "Subtract 3 from both sides to undo the +3."
    - "You have 2x = 8 — now divide both sides by 2."
  misconception_tags:
    - "alg/sign-error-on-move"       # writes 2x = 14
    - "alg/divides-one-side-only"    # writes x = 8
    - "alg/combines-unlike-terms"    # treats 2x + 3 as 5x
  prerequisite_skill_ids: ["alg-expressions", "num-integers"]
  remediation_skill_ids: ["num-integers", "alg-expressions"]
```

### Area of a rectangle

```yaml
- question_id: "geo-area-rect-q0011"
  skill_id: "geo-area-rect"
  domain: "D10 · Geometry"
  level_tag: "P4"
  difficulty: 2
  estimated_time_seconds: 18
  fluency_type: "procedural"
  question_type: "numeric_entry"
  prompt: "A rectangle is 8 cm long and 5 cm wide. What is its area?"
  answer:
    value: 40
    accepted: ["40", "40 cm²", "40 cm2"]
    unit: "cm²"
  worked_solution:
    - "Area of a rectangle = length × width."
    - "8 × 5 = 40."
    - "So the area is 40 cm²."
  hint_sequence:
    - "Area of a rectangle uses length and width — which operation?"
    - "Area = length × width."
    - "Multiply 8 × 5, and remember the unit is cm²."
  misconception_tags:
    - "geo/uses-perimeter-formula"   # computes 2(8+5) = 26
    - "geo/adds-sides"               # answers 13
    - "geo/wrong-area-unit"          # answers 40 cm instead of cm²
  prerequisite_skill_ids: ["geo-perimeter", "mul-by-2d"]
  remediation_skill_ids: ["mul-by-2d", "geo-perimeter"]
```

---

## 4. How Engines Consume a Tagged Question

| Engine | Reads | Uses it to |
| --- | --- | --- |
| **Generator** | `skill_id`, `difficulty`, `question_type`, `fluency_type` | Emit items at the right level and item type for the target skill. |
| **Auto-marker** | `answer.value`, `answer.accepted`, `answer.unit` | Mark first-try correctness; normalise equivalent forms. |
| **Mastery tracking** | `estimated_time_seconds`, hint usage, correctness | Update accuracy + first-try-time against the skill's mastery bar (`SKILL.md §1`). |
| **Misconception diagnosis** | `misconception_tags` | Map a wrong answer to a named error for targeted reteach. |
| **Remediation** | `remediation_skill_ids` | Route a repeated/diagnosed failure to the prerequisite to reteach (`SKILL.md §8`). |

> **Single source of truth:** a question never restates skill-level facts — it *references*
> them by `skill_id`. If a question's `domain`/`level_tag`/`fluency_type` disagree with the
> skill node in `SKILL.md`, the skill node wins and the question is mis-tagged.

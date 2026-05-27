# SKILL.md — Tian OS MathPath Knowledge Graph

The canonical model of **what MathPath teaches and in what order**. It defines the math
learning domains, the skills inside them, how skills depend on one another, how progression
flows from primary to secondary, and how each skill is classified for adaptive practice.

This graph is the shared source of truth for:

- **Placement testing** — probing nodes to locate a learner's working level (their "rung").
- **Recommendation engines** — choosing the next best skill from mastery + prerequisite state.
- **Adaptive pathways** — sequencing skills so prerequisites are always satisfied first.
- **Mastery tracking** — recording per-skill accuracy, speed, and fluency over time.
- **Remediation logic** — when a skill fails, routing the learner to the prerequisite that broke.

## Scope

MathPath is the **fluency and mastery** product. It focuses on:

- **Adaptive mastery** — every skill is drilled to a defined mastery bar before moving on.
- **Speed** — each skill has a `timeTarget`; fast recall is part of mastery, not a bonus.
- **Accuracy** — mastery requires ≥ 90% correct (`MASTERY_ACCURACY = 0.9`).
- **Fluency** — only **first-try, un-hinted** correct answers count toward fluency.
- **AI remediation** — diagnosed misconceptions route to a targeted reteach + re-attempt.
- **MOE-aligned skill tagging** — every skill carries a syllabus `code` and `objective`.

> **Out of scope (belongs to MathThink, a separate product):**
> ❌ Heuristic problem-solving methods (model/bar-model strategy as a *taught* technique, working-backwards, guess-and-check, etc.)
> ❌ Olympiad / competition math, non-routine multi-step puzzles, and enrichment problem sets.
>
> MathPath builds the *fluent computational and conceptual foundations* that MathThink later
> applies. Where the MOE syllabus lists word problems, MathPath covers only the
> single-answer fluency components, not the heuristic strategy instruction.

---

## 1. Skill Schema

Every node in the graph is a **skill**, tagged consistently so engines can reason over it.

| Field | Purpose |
| --- | --- |
| `id` | Stable unique key, e.g. `sg-p3-tables-mul`. |
| `domain` | Top-level learning domain (see §2). |
| `level` | Curriculum level, e.g. `P1`–`P6`, `S1`–`S4`. |
| `moeCode` | MOE syllabus reference, e.g. `MD 3.1`. |
| `objective` | Verbatim syllabus objective text. |
| `class` | `fluency` or `concept` (see §6). |
| `timeTarget` | Per-item speed target in seconds (drives the speed half of mastery). |
| `prerequisites` | List of skill `id`s that must be mastered first (see §4). |
| `unlocks` | Skills this one is a prerequisite for (reverse edges, for recommendation). |

**Mastery rule (per skill):** mastered when accuracy ≥ 90% **and** median first-try time
≤ `timeTarget × SPEED_GRACE`. Both conditions must hold. Fluency is measured only on
first-try, un-hinted, correct answers.

### 1.1 Standard Skill Node Schema (canonical, machine-readable)

The table above is the conceptual view; the **node schema** below is the canonical
machine-readable shape every engine reads and writes. New skills are authored against this
template. The conceptual fields map onto it 1:1 (`id`→`skill_id`, `level`→`level_tag`,
`objective`→`description`, `class`→`mastery_type`, `timeTarget`→`expected_time_seconds`,
`prerequisites`→`prerequisites`, `unlocks`→`extends_to`).

| Field | Type | Purpose / allowed values |
| --- | --- | --- |
| `skill_id` | string | Stable unique key, e.g. `frac-equiv`. Never reused or renamed. |
| `domain` | enum | Owning domain, `D1`–`D11` (see §2), written `D4 · Fractions`. |
| `skill_name` | string | Human-readable label. |
| `level_tag` | enum | Curriculum level: `P1`–`P6`, `S1`–`S4` (range allowed, e.g. `P3–P4`). |
| `description` | string | What the skill teaches — the verbatim MOE objective where one exists. |
| `prerequisites` | string[] | `skill_id`s that must be mastered before this is recommended (§4 forward edges, incoming). |
| `extends_to` | string[] | `skill_id`s this one unlocks (reverse edges, outgoing) — drives recommendation. |
| `mastery_type` | enum | `fluency` or `concept` (§6). Decides whether speed or accuracy leads in the mastery rule. |
| `fluency_type` | enum | Cognitive character of the items: `fact_recall` \| `procedural` \| `strategic` \| `none`. |
| `expected_time_seconds` | number | Per-item speed target; the speed half of mastery (`expected_time_seconds × speed_grace`). |
| `mastery_threshold` | object | `{ accuracy, speed_grace }`. Defaults `accuracy: 0.90` (`MASTERY_ACCURACY`), `speed_grace: 1.5` (`SPEED_GRACE`); concept skills may relax `speed_grace`. |
| `common_misconceptions` | string[] | Named diagnostic errors; AI remediation matches a miss to one of these. |
| `recommended_practice_mode` | enum | `drill_high_volume` \| `mixed_spaced` \| `worked_examples` \| `scaffolded_steps` \| `error_analysis`. |
| `question_tags` | string[] | Free-text tags for item generation and filtering. |

**Reusable template** (copy, fill, keep every field — use `null`/`[]` rather than omitting):

```yaml
- skill_id: ""                       # stable unique key, e.g. "frac-equiv"
  domain: ""                         # "D4 · Fractions"
  skill_name: ""
  level_tag: ""                      # "P1"…"P6" | "S1"…"S4" | range e.g. "P3–P4"
  description: ""                    # verbatim MOE objective where available
  prerequisites: []                  # [skill_id, …] must be mastered first
  extends_to: []                     # [skill_id, …] skills this one unlocks
  mastery_type: ""                   # fluency | concept
  fluency_type: ""                   # fact_recall | procedural | strategic | none
  expected_time_seconds: 0           # per-item speed target
  mastery_threshold:
    accuracy: 0.90                   # MASTERY_ACCURACY
    speed_grace: 1.5                 # SPEED_GRACE (concept skills may relax)
  common_misconceptions: []          # [string, …] diagnostic targets
  recommended_practice_mode: ""      # drill_high_volume | mixed_spaced | worked_examples | scaffolded_steps | error_analysis
  question_tags: []                  # [string, …]
```

**Example skill nodes** (the IDs, edges, and misconceptions below match §4 and the remediation chains in §8):

```yaml
- skill_id: "mul-tables-6789"
  domain: "D3 · Multiplication & Division"
  skill_name: "Multiplication tables of 6, 7, 8, 9"
  level_tag: "P3"
  description: "Recall multiplication facts for the 6, 7, 8 and 9 times tables."
  prerequisites: ["mul-tables-346"]
  extends_to: ["div-within-tables", "mul-3by1", "frac-equiv"]
  mastery_type: "fluency"
  fluency_type: "fact_recall"
  expected_time_seconds: 4
  mastery_threshold:
    accuracy: 0.90
    speed_grace: 1.25                # tight: automatic recall is the point
  common_misconceptions:
    - "confuses adjacent facts (7×8 read as 7×7)"
    - "adds instead of multiplies under time pressure"
    - "off-by-one-row recall slips (8×7 → 49)"
  recommended_practice_mode: "drill_high_volume"
  question_tags: ["times-table", "single-digit", "recall", "6", "7", "8", "9"]

- skill_id: "frac-equiv"
  domain: "D4 · Fractions"
  skill_name: "Equivalent fractions"
  level_tag: "P3"
  description: "Recognise and generate equivalent fractions by scaling numerator and denominator by the same factor."
  prerequisites: ["frac-half-quarter", "mul-tables-6789", "num-factors"]
  extends_to: ["frac-related-addsub", "frac-simplest", "dec-frac-convert"]
  mastery_type: "concept"
  fluency_type: "procedural"
  expected_time_seconds: 12
  mastery_threshold:
    accuracy: 0.90
    speed_grace: 2.0                 # relaxed: reasoning leads
  common_misconceptions:
    - "adds the same number to numerator and denominator instead of multiplying"
    - "scales only the numerator (or only the denominator)"
    - "thinks 1/2 ≠ 2/4 because the digits differ"
  recommended_practice_mode: "mixed_spaced"
  question_tags: ["fractions", "equivalence", "scaling", "numerator-denominator"]

- skill_id: "frac-addsub-unlike"
  domain: "D4 · Fractions"
  skill_name: "Add & subtract unlike fractions"
  level_tag: "P5"
  description: "Add and subtract fractions with different denominators by converting to a common denominator."
  prerequisites: ["frac-related-addsub", "num-primes"]
  extends_to: ["frac-multiply"]
  mastery_type: "concept"
  fluency_type: "procedural"
  expected_time_seconds: 25
  mastery_threshold:
    accuracy: 0.90
    speed_grace: 2.0
  common_misconceptions:
    - "adds numerators AND denominators (1/2 + 1/3 → 2/5)"
    - "uses the larger denominator without converting both fractions"
    - "finds the common denominator but forgets to rename the numerators"
  recommended_practice_mode: "worked_examples"
  question_tags: ["fractions", "unlike-denominators", "lcm", "common-denominator", "addition", "subtraction"]

- skill_id: "pct-of-quantity"
  domain: "D6 · Percentage"
  skill_name: "Percentage of a quantity"
  level_tag: "P5"
  description: "Find a given percentage of a whole quantity."
  prerequisites: ["pct-meaning", "frac-of-quantity"]
  extends_to: ["pct-increase-decrease"]
  mastery_type: "fluency"
  fluency_type: "procedural"
  expected_time_seconds: 15
  mastery_threshold:
    accuracy: 0.90
    speed_grace: 1.5
  common_misconceptions:
    - "reports the percentage itself as the answer (20% of 50 → 20)"
    - "divides by the percentage instead of multiplying by percent/100"
    - "misplaces the decimal when converting the % to a fraction or decimal"
  recommended_practice_mode: "mixed_spaced"
  question_tags: ["percentage", "of-a-quantity", "proportion", "mental"]

- skill_id: "alg-linear-eq"
  domain: "D8 · Algebra"
  skill_name: "Solving linear equations"
  level_tag: "S1"
  description: "Solve one-variable linear equations by balancing both sides."
  prerequisites: ["alg-expressions", "num-integers"]
  extends_to: ["alg-quadratics", "alg-simultaneous"]
  mastery_type: "concept"
  fluency_type: "strategic"
  expected_time_seconds: 40
  mastery_threshold:
    accuracy: 0.90
    speed_grace: 2.0
  common_misconceptions:
    - "keeps the sign when moving a term across the equals sign"
    - "divides only one side by the coefficient"
    - "combines unlike terms (2x + 3 → 5x)"
  recommended_practice_mode: "scaffolded_steps"
  question_tags: ["algebra", "linear-equation", "solve-for-x", "integers", "balancing"]
```

---

## 2. Core Math Learning Domains

The graph is organised into **domains** (stable, framework-independent) that the MOE strands
map onto. Domains persist across levels; the skills inside them deepen.

| Domain | What it covers | Primary span | Secondary span |
| --- | --- | --- | --- |
| **D1 · Number & Place Value** | Counting, place value, comparing/ordering, rounding, integers | P1–P6 | S1 |
| **D2 · Addition & Subtraction** | Mental and algorithmic add/subtract across magnitudes | P1–P4 | — |
| **D3 · Multiplication & Division** | Tables, algorithms, factors/multiples, remainders | P2–P6 | S1 |
| **D4 · Fractions** | Part-whole, equivalent, operations, fraction-of-quantity | P2–P6 | S1 |
| **D5 · Decimals** | Notation, place value, four operations, conversion | P4–P6 | S1 |
| **D6 · Percentage** | Meaning, of-a-quantity, increase/decrease, reverse percentage | P5–P6 | S1–S2 |
| **D7 · Ratio & Proportion** | Ratio notation, equivalent ratio, rate, direct/inverse proportion | P5–P6 | S1–S2 |
| **D8 · Algebra** | Patterns → unknowns → expressions → linear equations → quadratics | P5–P6 | S1–S4 |
| **D9 · Measurement** | Length, mass, volume, time, money, compound units | P1–P6 | S1 |
| **D10 · Geometry** | Shapes, angles, properties, Pythagoras, trigonometry, mensuration | P1–P6 | S1–S4 |
| **D11 · Statistics & Probability** | Reading/representing data, averages, probability | P2–P6 | S1–S4 |

---

## 3. Major Skills by Domain

Skill `id`s follow the curriculum convention `<curriculum>-<group>-<slug>` (e.g. `sg-p3-tables-mul`).
Classification: **`F`** = fluency-heavy, **`C`** = concept-heavy (see §6).

### D1 · Number & Place Value
- `num-count` — Counting & number bonds *(P1, F)*
- `num-pv-2` — Place value, tens & ones *(P1, C)*
- `num-pv-3` — Place value, hundreds *(P2, C)*
- `num-pv-4` — Place value, thousands *(P3, C)*
- `num-compare` — Comparing & ordering numbers *(P2–P3, F)*
- `num-pattern` — Number patterns / sequences *(P3, C)*
- `num-round` — Rounding & estimation *(P4, C)*
- `num-factors` — Factors & multiples *(P4, C)*
- `num-primes` — Prime numbers, HCF & LCM *(P5, C)*
- `num-integers` — Negative numbers & the number line *(S1, C)*

### D2 · Addition & Subtraction
- `add-bonds` — Number bonds within 20 *(P1, F)*
- `add-mental-2d` — Mental add/subtract (2-digit) *(P2–P3, F)*
- `add-algo-3d` — Column add/subtract within 1 000 *(P2, C)*
- `add-algo-4d` — Column add/subtract within 10 000 *(P3, C)*

### D3 · Multiplication & Division
- `mul-tables-2510` — Tables of 2, 5, 10 *(P2, F)*
- `mul-tables-346` — Tables of 3, 4, 6 *(P2–P3, F)*
- `mul-tables-6789` — Tables of 6, 7, 8, 9 *(P3, F)*
- `div-within-tables` — Dividing within the tables *(P3, F)*
- `div-remainder` — Division with remainder *(P3, C)*
- `mul-3by1` — Multiply 3-digit × 1-digit *(P3, C)*
- `div-3by1` — Divide 3-digit ÷ 1-digit *(P3, C)*
- `mul-by-2d` — Multiply/divide by 2-digit *(P4, C)*
- `num-order-ops` — Order of operations *(P5, C)*

### D4 · Fractions
- `frac-half-quarter` — Halves, quarters, part-whole *(P2, C)*
- `frac-equiv` — Equivalent fractions *(P3, C)*
- `frac-related-addsub` — Add/subtract related fractions *(P3–P4, C)*
- `frac-simplest` — Simplest form *(P4, F)*
- `frac-mixed` — Mixed numbers & improper fractions *(P4, C)*
- `frac-addsub-unlike` — Add/subtract unlike fractions *(P5, C)*
- `frac-multiply` — Multiply fractions *(P5, C)*
- `frac-divide` — Divide fractions *(P6, C)*
- `frac-of-quantity` — Fraction of a quantity *(P5, F)*

### D5 · Decimals
- `dec-notation` — Decimal notation & place value *(P4, C)*
- `dec-compare` — Compare & order decimals *(P4, F)*
- `dec-addsub` — Add & subtract decimals *(P4, C)*
- `dec-mul-div-10` — × and ÷ by 10, 100, 1000 *(P5, F)*
- `dec-mul-whole` — Multiply decimals by whole numbers *(P5, C)*
- `dec-div-whole` — Divide decimals by whole numbers *(P5, C)*
- `dec-frac-convert` — Convert fractions ↔ decimals *(P5, C)*

### D6 · Percentage
- `pct-meaning` — Percentage as parts per hundred *(P5, C)*
- `pct-of-quantity` — Percentage of a quantity *(P5, F)*
- `pct-frac-dec` — Convert percentage ↔ fraction ↔ decimal *(P5, F)*
- `pct-increase-decrease` — Percentage increase & decrease *(P6, C)*
- `pct-reverse` — Reverse percentage *(S1, C)*

### D7 · Ratio & Proportion
- `ratio-notation` — Ratio notation & meaning *(P5, C)*
- `ratio-equiv` — Equivalent & simplest-form ratio *(P5, F)*
- `ratio-share` — Sharing in a ratio *(P6, C)*
- `ratio-rate` — Rate & unit rate *(P6, C)*
- `ratio-direct-inverse` — Direct & inverse proportion *(S1–S2, C)*

### D8 · Algebra
- `alg-pattern` — Patterns & rules *(P5, C)*
- `alg-unknown` — Unknowns & simple equations *(P6, C)*
- `alg-expressions` — Algebraic expressions & substitution *(S1, C)*
- `alg-linear-eq` — Solving linear equations *(S1–S2, C)*
- `alg-expand-factor` — Expansion & factorisation *(S2, F)*
- `alg-quadratics` — Quadratic equations *(S3, C)*
- `alg-simultaneous` — Simultaneous equations *(S3, C)*

### D9 · Measurement
- `meas-length` — Length & compound units *(P1–P3, C)*
- `meas-mass` — Mass *(P2–P3, C)*
- `meas-volume` — Volume & capacity *(P3–P4, C)*
- `meas-time` — Telling time & duration *(P2–P4, C)*
- `meas-money` — Money: add, subtract & change *(P2–P3, F)*
- `meas-rate-speed` — Speed, distance & time *(P6, C)*

### D10 · Geometry
- `geo-shapes` — 2D & 3D shapes *(P1–P3, C)*
- `geo-perimeter` — Perimeter *(P3, F)*
- `geo-area-rect` — Area of rectangle & square *(P3–P4, F)*
- `geo-angles` — Angles & angle properties *(P4–P5, C)*
- `geo-area-triangle` — Area of triangle *(P5, C)*
- `geo-circle` — Circumference & area of circle *(P6, C)*
- `geo-volume-solids` — Volume of cubes/cuboids *(P5–P6, C)*
- `geo-pythagoras` — Pythagoras' theorem *(S2, C)*
- `geo-trig` — Trigonometric ratios *(S3, C)*
- `geo-mensuration` — Mensuration of solids *(S3, C)*

### D11 · Statistics & Probability
- `stat-pictogram` — Picture graphs & pictograms *(P2–P3, C)*
- `stat-bar` — Bar graphs *(P3–P4, C)*
- `stat-tables-line` — Tables & line graphs *(P4–P5, C)*
- `stat-average` — Average (mean) *(P5, F)*
- `stat-pie` — Pie charts *(P6, C)*
- `stat-measures` — Mean, median, mode *(S1, F)*
- `prob-basic` — Basic probability *(S2, C)*

---

## 4. Prerequisite Relationships

Edges are directed: `A → B` means **A must be mastered before B is recommended**. The
recommendation engine only surfaces a skill once *all* its prerequisites are mastered; the
remediation engine walks edges *backwards* to find the broken foundation.

### Within-domain core edges

```
num-count → num-pv-2 → num-pv-3 → num-pv-4 → num-compare → num-round
add-bonds → add-mental-2d → add-algo-3d → add-algo-4d
mul-tables-2510 → mul-tables-346 → mul-tables-6789 → div-within-tables → div-remainder
mul-tables-6789 → mul-3by1 → mul-by-2d
frac-half-quarter → frac-equiv → frac-related-addsub → frac-addsub-unlike → frac-multiply → frac-divide
dec-notation → dec-compare → dec-addsub → dec-mul-whole → dec-div-whole
pct-meaning → pct-of-quantity → pct-increase-decrease → pct-reverse
ratio-notation → ratio-equiv → ratio-share → ratio-direct-inverse
alg-pattern → alg-unknown → alg-expressions → alg-linear-eq → alg-quadratics
```

### Cross-domain edges (the dependencies that drive most remediation)

```
add-bonds            → mul-tables-2510        (multiplication is repeated addition)
mul-tables-6789      → frac-equiv             (scaling numerator/denominator)
div-within-tables    → frac-simplest          (dividing by a common factor)
num-factors          → frac-simplest          (finding common factors)
num-primes (HCF/LCM) → frac-addsub-unlike     (common denominators)
frac-equiv           → dec-frac-convert       (fractions ↔ decimals)
dec-frac-convert     → pct-frac-dec           (the % ↔ fraction ↔ decimal triangle)
frac-of-quantity     → pct-of-quantity        (percentage is a fraction of a quantity)
frac-multiply        → ratio-share            (sharing as a fraction of the whole)
add-algo-4d          → dec-addsub             (column alignment carries over to decimals)
mul-by-2d            → geo-area-rect          (area = length × width)
alg-unknown          → meas-rate-speed        (speed = distance ÷ time as a formula)
num-integers         → alg-linear-eq          (signed arithmetic in equations)
geo-area-rect        → geo-area-triangle      (½ × base × height)
```

### 4.1 Core Skill Graph — Prerequisite Edge List

The full, typed edge list the graph engine loads. Each edge is three lines:

```
source_skill_id -> target_skill_id
relationship_type
reason
```

**`relationship_type` vocabulary**

| Type | Meaning |
| --- | --- |
| `sequential` | Direct next step within the same domain spine. |
| `fluency_gate` | Source is a recall/fluency skill that must be automatic before the target is attempted. |
| `cross_domain` | Dependency linking two different domains (§4 cross-domain edges). |
| `bridge` | Crosses the primary → secondary boundary (§5 spine continuation). |

#### Arithmetic fluency chains

```
num-count -> num-pv-2
sequential
Place-value notation builds on stable counting and number bonds.

num-pv-2 -> num-pv-3
sequential
Hundreds extend the tens-and-ones place-value idea.

num-pv-3 -> num-pv-4
sequential
Thousands extend place value one column further.

num-pv-4 -> num-compare
sequential
Comparing/ordering reads digits by place value, largest first.

num-compare -> num-round
sequential
Rounding decides nearer value, which requires comparing place values.

num-factors -> num-primes
sequential
Primes, HCF and LCM are built from factors and multiples.

add-bonds -> add-mental-2d
sequential
Mental 2-digit add/subtract composes single-digit bonds.

add-mental-2d -> add-algo-3d
sequential
The column algorithm formalises mental add/subtract for larger numbers.

add-algo-3d -> add-algo-4d
sequential
Four-digit columns extend three-digit carrying/borrowing.

add-bonds -> mul-tables-2510
cross_domain
Multiplication is repeated addition; bonds make the skip-counting automatic.

mul-tables-2510 -> mul-tables-346
sequential
Tables of 3, 4, 6 extend the 2, 5, 10 facts.

mul-tables-346 -> mul-tables-6789
sequential
Tables of 6, 7, 8, 9 complete the single-digit fact set.

mul-tables-6789 -> div-within-tables
sequential
Dividing within the tables is the inverse of the multiplication facts.

div-within-tables -> div-remainder
sequential
Remainder division extends exact division facts.

mul-tables-6789 -> mul-3by1
fluency_gate
Single-digit facts must be automatic before multi-digit partial products.

add-algo-3d -> mul-3by1
cross_domain
Long multiplication carries during the addition of partial products.

mul-3by1 -> mul-by-2d
sequential
Two-digit multipliers extend the 3-by-1 procedure.

mul-by-2d -> num-order-ops
cross_domain
Order of operations presumes fluent multiplication and division.
```

#### Fraction → ratio / percentage chains

```
frac-half-quarter -> frac-equiv
sequential
Equivalent fractions generalise the halves/quarters part-whole idea.

mul-tables-6789 -> frac-equiv
fluency_gate
Scaling numerator and denominator requires automatic multiplication facts.

num-factors -> frac-simplest
cross_domain
Simplest form requires finding the common factor to cancel.

div-within-tables -> frac-simplest
fluency_gate
Simplifying divides numerator and denominator by a common factor.

frac-equiv -> frac-related-addsub
sequential
Adding related fractions renames one to match the other denominator.

frac-related-addsub -> frac-addsub-unlike
sequential
Unlike denominators extend the related-fraction renaming.

num-primes -> frac-addsub-unlike
cross_domain
Common denominators come from the LCM of the denominators.

frac-addsub-unlike -> frac-multiply
sequential
Multiplying fractions follows the four-operation progression.

frac-multiply -> frac-divide
sequential
Division of fractions is multiplication by the reciprocal.

frac-multiply -> frac-of-quantity
cross_domain
"Fraction of a quantity" is multiplication of a fraction by a whole.

frac-equiv -> ratio-equiv
cross_domain
Equivalent ratios scale like equivalent fractions.

ratio-notation -> ratio-equiv
sequential
Equivalent/simplest-form ratios build on ratio notation.

frac-multiply -> ratio-share
cross_domain
Sharing in a ratio is taking each part as a fraction of the whole.

ratio-equiv -> ratio-share
sequential
Sharing uses equivalent ratios to split a total.

ratio-share -> ratio-rate
sequential
Rate generalises ratio comparison to per-unit quantities.

frac-of-quantity -> pct-of-quantity
cross_domain
A percentage of a quantity is a fraction (out of 100) of that quantity.

frac-equiv -> pct-meaning
cross_domain
Percentage is a fraction with denominator 100; equivalence makes the rename.
```

#### Decimal → percentage chains

```
add-algo-4d -> dec-addsub
cross_domain
Column alignment and carrying transfer from whole numbers to decimals.

dec-notation -> dec-compare
sequential
Comparing decimals reads digits by decimal place value.

dec-compare -> dec-addsub
sequential
Adding/subtracting decimals lines up by place value.

dec-addsub -> dec-mul-whole
sequential
Multiplying decimals by whole numbers extends decimal arithmetic.

dec-mul-whole -> dec-div-whole
sequential
Dividing decimals by whole numbers is the inverse operation.

frac-equiv -> dec-frac-convert
cross_domain
Converting a fraction to a decimal renames it over a power of ten.

dec-frac-convert -> pct-frac-dec
cross_domain
The %–fraction–decimal triangle builds on fraction↔decimal conversion.

pct-meaning -> pct-frac-dec
sequential
Converting between % forms requires the parts-per-hundred meaning.

pct-frac-dec -> pct-of-quantity
cross_domain
Computing a percentage converts it to a fraction/decimal first.

pct-meaning -> pct-of-quantity
sequential
Finding a percentage of a quantity applies the parts-per-hundred meaning.

pct-of-quantity -> pct-increase-decrease
sequential
Increase/decrease adds or subtracts a percentage of the original.

pct-increase-decrease -> pct-reverse
bridge
Reverse percentage (S1) inverts the increase/decrease relationship.
```

#### Algebra readiness chains

```
num-pattern -> alg-pattern
cross_domain
Algebraic rules generalise observed number-sequence patterns.

alg-pattern -> alg-unknown
sequential
Naming the rule introduces an unknown to solve for.

alg-unknown -> alg-expressions
sequential
Expressions and substitution extend simple unknowns.

num-order-ops -> alg-expressions
cross_domain
Simplifying and substituting relies on order of operations.

num-integers -> alg-linear-eq
cross_domain
Moving terms across the equals sign needs signed-number arithmetic.

alg-expressions -> alg-linear-eq
sequential
Solving equations manipulates and simplifies expressions.

alg-linear-eq -> alg-simultaneous
sequential
Simultaneous equations solve two linear equations together.

alg-expressions -> alg-expand-factor
sequential
Expansion and factorisation manipulate algebraic expressions.

alg-expand-factor -> alg-quadratics
sequential
Solving quadratics by factorisation requires expand/factor fluency.

alg-linear-eq -> alg-quadratics
sequential
Quadratics extend the equation-solving toolkit beyond linear.
```

#### Geometry progression chains

```
geo-shapes -> geo-perimeter
sequential
Perimeter sums the side lengths of a known 2D shape.

geo-perimeter -> geo-area-rect
sequential
Area follows perimeter as the next property of rectangles/squares.

mul-by-2d -> geo-area-rect
cross_domain
Area of a rectangle is length × width.

geo-area-rect -> geo-area-triangle
sequential
Triangle area is half the enclosing rectangle (½ × base × height).

geo-area-rect -> geo-volume-solids
sequential
Volume of a cuboid extends rectangle area by a third dimension.

geo-shapes -> geo-angles
sequential
Angle properties are read off the shapes already classified.

geo-area-triangle -> geo-circle
sequential
Circle area continues the plane-area progression with πr².

geo-area-rect -> geo-pythagoras
bridge
Pythagoras compares the areas of squares on a triangle's sides.

geo-angles -> geo-trig
bridge
Trigonometric ratios relate angles (S-level) to side lengths.

geo-pythagoras -> geo-trig
sequential
Trig builds on the right-triangle side relationships of Pythagoras.

geo-volume-solids -> geo-mensuration
bridge
Mensuration of solids extends cube/cuboid volume to more solids.

geo-circle -> geo-mensuration
cross_domain
Curved surfaces (cylinders, cones) need circle circumference/area.
```

#### Measurement progression chains

```
meas-length -> meas-volume
sequential
Compound-unit conversion generalises from length to volume/capacity.

add-mental-2d -> meas-money
cross_domain
Money calculations (add, subtract, change) use 2-digit mental arithmetic.

meas-time -> meas-rate-speed
cross_domain
Speed = distance ÷ time requires reading and computing durations.

ratio-rate -> meas-rate-speed
cross_domain
Speed is a rate; unit-rate reasoning underpins distance–time.

alg-unknown -> meas-rate-speed
cross_domain
Speed/distance/time is applied as a rearrangeable formula.

meas-volume -> geo-volume-solids
cross_domain
Measured capacity grounds the volume of solids in geometry.
```

#### Statistics progression chains

```
stat-pictogram -> stat-bar
sequential
Bar graphs extend pictograms from icons to scaled bars.

stat-bar -> stat-tables-line
sequential
Tables and line graphs extend categorical bars to continuous data.

stat-tables-line -> stat-pie
sequential
Pie charts add proportional (whole-of-360°) representation.

add-mental-2d -> stat-average
fluency_gate
The mean sums the data values before dividing.

div-within-tables -> stat-average
cross_domain
The mean divides the total by the count of values.

pct-of-quantity -> stat-pie
cross_domain
Pie sectors are sized as percentages (or fractions) of the whole.

stat-average -> stat-measures
bridge
Median and mode (S1) extend the mean as measures of centre.

frac-of-quantity -> prob-basic
cross_domain
A probability is the fraction of favourable outcomes over the whole.

stat-measures -> prob-basic
bridge
Data summary (S-level) progresses into the language of chance.
```

---

## 5. Cross-Level Progression (Primary → Secondary)

Each domain has a **spine** that threads from foundational primary skills into secondary
abstractions. The graph is continuous: a secondary skill simply lists its primary
prerequisites, so placement and remediation can cross the P/S boundary seamlessly.

| Domain | Primary foundation | Bridge skill | Secondary continuation |
| --- | --- | --- | --- |
| Number | Place value, factors, HCF/LCM | `num-integers` (S1) | Indices, standard form, real numbers |
| Mult./Div. | Tables → long mult./division | `num-order-ops` (P5) | Indices & laws of arithmetic |
| Fractions | Four operations on fractions | `frac-divide` (P6) | Algebraic fractions |
| Decimals | Four operations, conversion | `dec-frac-convert` (P5) | Standard form, rounding to s.f. |
| Percentage | % of quantity, inc./dec. | `pct-reverse` (S1) | Profit/loss, interest, growth |
| Ratio | Sharing, rate | `ratio-direct-inverse` (S1) | Proportion, map scale, similarity |
| **Algebra** | Patterns → unknowns | `alg-expressions` (S1) | Linear → simultaneous → quadratics |
| Geometry | Angles, area, volume | `geo-angles` (P5) | Pythagoras → trig → mensuration |
| Statistics | Graphs, mean | `stat-measures` (S1) | Dispersion, probability |

> **Placement note:** A learner entering MathPath at secondary level is probed on the
> *bridge skills* first. A failure there routes placement *down* into the primary spine of
> that domain, so secondary learners with gaps are re-grounded rather than blocked.

---

## 6. Fluency-Heavy vs Concept-Heavy Classification

Every skill is classified to tune practice volume, item generation, and the speed weighting
of mastery.

### Fluency-heavy (`class: fluency`)
Recall- and procedure-dominant skills where **speed is the point**. Mastery weights the
`timeTarget` strongly; sessions favour high item counts and short, automatic items.

- Number bonds, all multiplication tables, dividing within tables
- Mental 2-digit add/subtract, money calculations
- Equivalent-ratio simplest form, fraction of a quantity
- % ↔ fraction ↔ decimal conversions, multiply/divide by powers of 10
- Perimeter and rectangle area (formula recall), mean, expand & factorise (drill)

### Concept-heavy (`class: concept`)
Understanding- and multi-step skills where **accuracy and reasoning lead**. Mastery weights
accuracy more; the speed grace is more generous; AI remediation leans on worked examples and
representations rather than repetition.

- Place value, rounding, factors/primes/HCF/LCM, order of operations
- Column algorithms with carrying/borrowing, long multiplication/division, remainders
- Add/subtract unlike fractions, multiply/divide fractions, mixed numbers
- Decimal operations, percentage increase/decrease, reverse percentage
- Ratio sharing, direct/inverse proportion, all algebra skills
- Angles, triangle/circle area, volume, Pythagoras, trigonometry, data interpretation

> **Why it matters for remediation:** a fluency miss usually means *under-practice* → more
> reps of the same skill. A concept miss usually means a *broken prerequisite* → walk the
> graph backwards (§4) and reteach the foundation before re-attempting.

---

## 7. Example Mastery Pathways

A **mastery pathway** is the ordered chain the adaptive engine would surface to take a learner
from a known starting point to a target skill, with each step's prerequisites satisfied.

### Pathway A — "From tables to fractions" (P2 → P4)
```
mul-tables-2510 → mul-tables-346 → mul-tables-6789 → div-within-tables
→ frac-equiv → frac-simplest → frac-related-addsub
```
*Goal:* reach reliable fraction equivalence. Note the cross-domain hop from division facts
into `frac-simplest` (you simplify by dividing out a common factor).

### Pathway B — "The proportion triangle" (P5 → S1)
```
frac-equiv → dec-frac-convert → pct-frac-dec → pct-of-quantity
→ ratio-notation → ratio-equiv → ratio-share → ratio-direct-inverse
```
*Goal:* fluent movement between fractions, decimals, percentages, and ratios — the backbone
of secondary proportional reasoning.

### Pathway C — "Into algebra" (P5 → S2)
```
num-pattern → alg-pattern → alg-unknown → num-integers
→ alg-expressions → alg-linear-eq
```
*Goal:* reach confident linear-equation solving. `num-integers` is injected mid-chain because
signed arithmetic is a prerequisite the learner often lacks at the P→S boundary.

### Pathway D — "Area to volume" (P3 → P6)
```
mul-by-2d → geo-area-rect → geo-area-triangle → geo-volume-solids
```
*Goal:* mensuration fluency, each step reusing the multiplicative structure of the last.

---

## 8. Example Prerequisite Chains (for Remediation)

When a learner fails a skill, the remediation engine reports the **chain** it walked to find
the likely root cause. These are the canonical diagnostic chains.

### Chain 1 — failing `frac-addsub-unlike` (add/subtract unlike fractions)
```
frac-addsub-unlike
  └─ requires frac-equiv            (to rename fractions)
        └─ requires mul-tables-6789 (to scale numerator & denominator)
  └─ requires num-primes (HCF/LCM)  (to find the common denominator)
        └─ requires num-factors
```
*Remediation:* if equivalence is shaky → drill `frac-equiv`; if the learner can't find common
denominators → reteach LCM via `num-primes`.

### Chain 2 — failing `pct-of-quantity` (percentage of a quantity)
```
pct-of-quantity
  └─ requires pct-meaning           (% as parts per hundred)
  └─ requires frac-of-quantity      (% is a fraction of a whole)
        └─ requires frac-multiply
              └─ requires frac-equiv
```
*Remediation:* most misses here trace to `frac-of-quantity`; reteach "of = multiply" before
re-attempting the percentage item.

### Chain 3 — failing `alg-linear-eq` (solving linear equations)
```
alg-linear-eq
  └─ requires alg-expressions       (substitution & simplifying)
        └─ requires alg-unknown
              └─ requires alg-pattern
  └─ requires num-integers          (signed arithmetic when moving terms)
        └─ requires num-round / number sense
```
*Remediation:* a learner who can set up but mis-solves equations usually has a `num-integers`
gap (sign errors), not an algebra gap — route there first.

### Chain 4 — failing `mul-3by1` (multiply 3-digit × 1-digit)
```
mul-3by1
  └─ requires mul-tables-6789       (single-digit facts must be automatic)
  └─ requires add-algo-3d           (carrying during partial products)
```
*Remediation:* if facts are slow → drill `mul-tables-6789` (fluency); if carrying is the issue
→ reteach `add-algo-3d` (concept).

---

## 9. How Engines Consume This Graph

| Engine | Reads | Produces |
| --- | --- | --- |
| **Placement** | domains, levels, bridge skills, `prerequisites` | starting "rung" per domain |
| **Recommendation** | mastery state + `prerequisites`/`unlocks` | next-best unlocked skill |
| **Adaptive pathway** | edges (§4), pathways (§7) | ordered upcoming sequence |
| **Mastery tracking** | per-skill accuracy, first-try time, `timeTarget`, `class` | mastered / in-progress / not-started |
| **Remediation** | reverse edges, chains (§8), `class` | the prerequisite to reteach + re-attempt |

> **Single source of truth:** when adding a skill, set its `domain`, `moeCode`, `objective`,
> `class`, `timeTarget`, and `prerequisites` — every engine above derives its behaviour from
> those fields. Keep heuristic-strategy and Olympiad content out; that graph lives in MathThink.

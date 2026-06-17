# MathPath Question-Generator Quality Audit

**Date:** 2026-06-16
**Scope:** All 16 MathPath question-generation domains under `shared/mathpath/<domain>/*QuestionGenerator.js` (plus the Word-Problems/Heuristics surface).
**Method:** Close code reading + running each generator as ESM and sampling 10–20 real outputs per domain across skills/levels. Production wiring verified (`services/mathpath/*PracticeService.js`, `frontend/src/mathpath/primary/p1–p6Orchestrator.js`).
**No code was changed.** This is an audit + recommended-fix document only.

---

## Executive summary

**No domain is exam-ready today.** The work splits into two very different failure classes:

1. **Stub generators (4 domains fully, others partially): the generator ignores its own topic and emits `Compute: a + b = ?` for every skill.** Confirmed by source count of the `return a + b` / `Compute: ${a} + ${b}` pattern: Operations (96), Number Sense (92), Geometry (88), Measurement (56). These are wired into production practice and are being served to students as "Whole Numbers," "Four Operations," "Geometry," and "Measurement." This is a **content-integrity emergency**, not a tuning problem.

2. **Real generators with real bugs (the rest): they compute the right *kind* of question but ship specific correctness errors** — wrong answer keys, factor-of-4 / factor-of-10 area & pie-chart errors, fabricated time arithmetic, negative "money left," self-contradicting prompts, a runtime crash, and floating-point garbage in options. Several also reach **beyond the Singapore primary syllabus** (Algebra equation-solving, Number Sense negative numbers).

**Cross-cutting defects present in nearly every domain** (even the good ones):
- **Worked solutions are placeholder boilerplate** — `['Identify the key information.','Apply the correct method.','Calculate: <answer>']` — in Operations, Number Sense, Geometry, Measurement, Money, Time, Statistics, Volume, Area/Perimeter, Circles, Algebra. Zero pedagogical value and, where the key is wrong, actively misleading.
- **Distractors are `answer ± random`, not misconception-based.** Rich `misconceptionTag` metadata exists on every family but is never used to build wrong options — so the misconception catalogue is decorative and MCQs cannot diagnose anything.
- **No diagrams anywhere.** Every domain that *requires* a figure in Singapore papers — clocks, bar/line/pie graphs, angle figures, cuboids/nets, composite area, circles, number lines, place-value charts — emits text only. This breaks the concrete-pictorial-abstract approach and makes many items ambiguous or unsolvable-as-intended.
- **`variant`/`v` is computed but unused** in the templated domains, so within a family only number-swaps vary → heavy repetition and frequent exact duplicates.
- **Answers are unit-free bare numbers** (`"480"` not `"480 cm³"`, `"3"` not `"$3.00"`), and strict-string answer-checkers then mark syllabus-correct unit-bearing responses **wrong**.
- **Dead `if(false)/if(true)` branches** throughout the templated domains confirm machine-scaffolded code whose content layer was never written.

**The surrounding architecture is genuinely good** and worth keeping: skill graphs are acyclic, level-tagged, prerequisite-ordered and validated; question-family metadata (fluency targets, mastery thresholds, misconception tags) is rich; practice engines and learning-path models implement real adaptive logic. **The defect surface is almost entirely the `*QuestionGenerator.js` content layer.**

---

## Classification table

| Domain | Classification | Headline issue |
|---|---|---|
| Fractions | **Needs major review** | Most mature domain, but F010/F005/F015 answer-key vs prompt mismatches; simplify-skill accepts unsimplified answers; misconception engine has a false-positive on a correct answer |
| Decimals | **Needs major review** | Integer-cents arithmetic is sound (no float noise), but decimal×whole drops the point; "round to 1 d.p." returns whole numbers; division emits millionths (off-syllabus) |
| Percentage | **Needs major review** | Arithmetic correct, but money renders `$4.4`; GST/discount land on awkward cents; only 2 of 20 families are MCQ so misconceptions never exercised |
| Ratio & Rate | **Needs major review** | **Runtime crash ~27% of `R009_002`**; "Speed" skill never asks for speed; "(Word)" families duplicate their symbolic siblings |
| Whole Numbers / Number Sense | **Not exam-ready** | **STUB** — every skill emits `Compute: a+b`; negative numbers wrongly tagged Primary |
| Four Operations | **Not exam-ready** | **STUB** — all 48 generators return `a+b`; no subtraction/×/÷/long-division/order-of-ops exists |
| Money | **Not exam-ready** | Negative "money left" 50% of the time; malformed `$0.4.40` amounts; bare-integer answers; float-money risk |
| Time | **Not exam-ready** | Duration answer **fabricated** (`a*60+b*5`, not end−start); impossible clock faces (`20:15`), `70 minutes`, `14:50 pm` |
| Measurement | **Not exam-ready** | **STUB** — all 28 generators return `a+b`; no units, no conversion logic at all |
| Area & Perimeter | **Not exam-ready** | L-shape perimeter key **wrong** (42 vs listed 54); composite figures incoherent; cost question gives away its own answer |
| Volume | **Not exam-ready** | Computes l×b×h, but VL003 MCQ is self-contradictory ("9 cm cube… height doubles to 2 cm"); nets skill has no nets; no L↔cm³ conversion |
| Geometry | **Not exam-ready** | **STUB** — all 44 generators return `a+b`; no angle sums, no shapes, no figures |
| Circles | **Not exam-ready** | **Area-by-diameter wrong by ×4** (every `CI003_1`); semicircle/quarter **perimeter** entirely missing; float garbage in options (`20.560000000000002`) |
| Statistics | **Not exam-ready** | Pie degrees **wrong ×10** (40%→14°); "new mean" returns the added score; %>100 impossible data; no graphs drawn |
| Algebra | **Not exam-ready** | AL001/AL002 answer = total not the unknown (`n+7=22 → 22`); AL007–AL010 are Secondary content; AL009 prompt and key use different formulas |
| Word Problems / Heuristics | **Needs major review** | Strong hand-authored HTML, but the flagship "Find a Pattern" example's figure contradicts its own table; `extractVars` silently drops `p1/p2`-style vars → empty generation |

---

## Priority triage (recommended order of work)

**P0 — stop serving broken content to students (this week)**
1. Gate or disable the four **stub** practice domains in production (Number Sense, Four Operations, Geometry, Measurement) until real content exists. They are currently `practice: 'available'` in `domainCatalog.js` and reachable via the practice services / orchestrators.
2. Fix the **wrong-answer-key** correctness bugs that grade students incorrectly on otherwise-shipping domains: Circles area-by-diameter (×4), Statistics pie degrees (×10) and "new mean", Algebra AL001/AL002 and AL009, Area & Perimeter L-shape, Time duration, Money negative/ malformed amounts.
3. Fix the **Ratio & Rate runtime crash** (`ratioRateQuestionGenerator.js:360`).

**P1 — syllabus & safety**
4. Remove out-of-syllabus content: Algebra equation-solving (AL007–AL010), Number Sense negative numbers (NS021–023), reconsider Percentage simple interest.
5. Cap/round number generation: Decimals division precision (≤3 d.p.), Percentage/Money cents formatting, Circles π selection + rounding instructions + units.

**P2 — pedagogy (applies to every domain)**
6. Replace boilerplate worked solutions with real, method-specific steps.
7. Generate misconception-driven distractors from the existing `misconceptionTag` metadata.
8. Emit diagram payloads for figure-dependent skills and assert figure↔prompt↔answer consistency.
9. Make `variant` actually drive variety; add a per-set duplicate guard; attach units to answers and make checkers unit-tolerant.

**P3 — quality harness**
10. Add a generation-time validator that, for every item, re-derives the answer independently and rejects impossible cases (negative quantities, %>100, minutes ≥ 60, part>whole, unit-free answers, the literal string `"Compute:"`). A single "no answer key may be the bare `a+b`" assertion would have caught the entire stub class.

---

## Per-domain findings

### Fractions
**Classification:** Needs major review

**Strengths:**
- Core arithmetic correct for the bulk of skills: same/different-denominator add/subtract (F016–F019), fraction-of-quantity (F003, F020), multi-step word problems (F023, F024); F003/F020 reliably yield integers.
- Diagrams match the question where emitted (F001 "1 shaded of 8" → `{parts:8, shaded:1}`).
- Answer checker (`checkFractionAnswer`) is equivalence-based, preventing many false negatives.
- Syllabus level tags broadly correct (F022 division tagged P6, F012 simplify P4).

**Findings:**
1. **F010 fill-in-the-blank answer is wrong — the correct fill is rejected.** Critical. `fractionQuestionGenerator.js:871-874`: prompt `Complete: 4/8 = ?/32`, but answer is simplified to `"1/2"`; a student typing the correct blank `16` is marked wrong while "1/2" (which doesn't fill `?/32`) is accepted. The worked solution itself says "4/8 = 16/32", contradicting the stored answer.
2. **F005 number-line answer display contradicts accepted answer.** High. `:745-747`: `answer` simplifies (2/8 → "1/4") but `acceptedAnswers:["2/8"]`. At P3 a number-line mark should read `pos/d` un-simplified.
3. **F015 mixed→improper worked solution self-contradicts.** High. `:1163-1199`: "Multiply 2 × 4 = 8. Add 2: 10. Result: 5/2." — student following the method gets 10/4, key says 5/2. Source "2 2/4" is also not in simplest form.
4. **F021 "Multiply Fractions" (P6) emits whole×whole.** High. `:1379-1388`: operands collapse to integers → "Compute: 2 × 6" with no fraction.
5. **F012 "Simplify" emits comparison questions and accepts unsimplified answers.** High. `:934-963`: comparison families leak in; equivalence-checker accepts "10/14" for "simplify 10/14", defeating the skill.
6. **Misconception engine misses the most common P3 error and mislabels others.** High. `fractionMistakeToMasteryEngine.js:359-433`: no rule for F016/F017 add-both-parts ("5/6+3/6→8/12" falls to generic M010); F015 branch mislabeled; operand-based detectors require `promptOperands` the generator never emits.
7. **F019 misconception rule false-positives on the correct answer.** High. `:373-378`: flags the correct 1/6 of "2/3 − 1/2" as misconception M007 (missing `!fractionEqual` guard).
8. **F026 mastery word problems can degenerate to "1 of N".** Medium. `:1591-1598`.
9. **F023 name/pronoun mismatches and "improper-of-a-set" phrasing.** Medium. "Ben had 28 coins. She gave 3/4…"; "Find 3/2 of the set."
10. **Generic noun pool yields nonsense contexts.** Medium. "A baker used 2 1/3 trays of books/students/marks." (`:213-228`, `:1191`).
11. **High repetition from small seed space.** Low. Single-question calls don't dedupe (exact dupes observed).
12. **Reachable placeholder fallback.** Low. `:1601-1607` returns "Placeholder fraction question." for unmapped skills.

**Recommended fixes:** (1) F010: store the blank value (`16`) un-simplified. (2) F005: don't auto-simplify; fix ordinal in solution. (3) F015: build improper fraction un-simplified, constrain source to lowest terms. (4) F021: reject degenerate (integer) operands. (5) F012: remove comparison families, enforce simplest-form for this skill. (6) Add explicit F016/F017 add-both-parts rules; emit `promptOperands`. (7) Add `!fractionEqual` guard to F019. (8) Constrain F026 fraction to (0,1). (9) Gender-consistent name/pronoun; drop/reword improper-of-set. (10) Per-template context nouns. (11) Widen seed space / expose dedup. (12) Throw on unmapped skill instead of placeholder.

### Decimals
**Classification:** Needs major review

**Strengths:**
- Arithmetic on scaled integers — classic binary-float noise genuinely avoided (swept ~1,100 items, zero `0.30000004` artifacts).
- Skill graph clean, acyclic, P4→P6 progression sound; misconception tags well-chosen.
- Most answers and worked solutions arithmetically correct; division families construct exact-terminating dividends.

**Findings:**
1. **Decimal × whole "loses the point" with self-contradictory solution.** Critical. `decimalsQuestionGenerator.js:283-298`: trailing-zero stripping degrades the prompt — "8 × 4" with solution "80 × 4 = 320 … product = 32." ~1 in 8 items.
2. **"Round to 1 d.p." returns a whole number.** High. `:216-220`: "Round 5.97 to 1 d.p. → 6" (must be 6.0); `acceptedAnswers` only has `"6"`, so a pupil writing 6.0 risks being marked wrong.
3. **Divide-by-power-of-ten emits millionths (off-syllabus).** High. `:263`: 21/40 division items had 5 d.p., 5 had 6 d.p.; P5/P6 stops at thousandths.
4. **Comparison MCQs only ever have 2 options and never test the symbol task.** High. `:157-181`; family `QF_D003_002` "Insert <, > or =" never generates `=`.
5. **Multiple families are duplicates that ignore their declared name.** Medium. "Value of a Digit"/"Expanded Form"/"Place a Decimal"/"Decimal × Whole (Word)" all run the wrong generator.
6. **Number-line / compare prompts reference a diagram never produced.** Medium. `:142-144`, `:157`.
7. **Place-value family never asks the *value* of a digit, only its identity.** Low. `:115-135`.
8. **`decStr` trailing-zero stripping is the shared root cause and weakens answer-checking.** Medium. `:46-51`.

**Recommended fixes:** (1) Preserve fixed-dp formatting in `decimalMultWhole`. (2) Format rounding answers to target dp; accept padded + unpadded. (3) Cap division at ≤3 d.p. (4) Full 4-option compare MCQ incl. `=`. (5) Distinct generator per family. (6) Emit number-line diagram payload. (7) Add place-value-*value* variant. (8) Always include canonical trailing-zero forms in `acceptedAnswers`.

### Percentage
**Classification:** Needs major review

**Strengths:**
- All ~80 sampled answers correct; integer-forcing (`step = 100/gcd(p,100)`) keeps results whole.
- Skill graph well-ordered, acyclic; misconception map is high quality (real P5/P6 errors + remediation + parent notes).
- GST rate pool includes the current Singapore 9%.

**Findings:**
1. **Money answers display malformed cents.** Critical. `percentageQuestionGenerator.js:308,331,336`: `$4.4`, `$10.8`, `$65.4` instead of `$4.40`… 229/400 GST outputs affected.
2. **GST/discount/increase produce awkward cents from whole-dollar prices.** Major. `:322-331`: `$4.55`, `$10.85` — real exam items engineer clean totals.
3. **"Find the Whole" worked solution contradicts the unitary method.** Major. `:230-231`: "1% = 0.44 … 100% = 44" models a fragile decimal route; "harder" variant isn't harder.
4. **MCQ distractors collapse below 4 options.** Major. `:109`: when `n=50`, `100-n` duplicates the answer, leaving 3 choices; `mcq()` doesn't backfill.
5. **Weak distractors in the only MCQ family.** Major. `:109`: `n*10%` (860%) eliminated instantly; the mapped misconception is never instantiated.
6. **18 of 20 families are short-answer, so distractors/misconceptions almost never exercised.** Major.
7. **Simple interest (P010) is arguably out of P5/P6 scope.** Moderate. `:349-375`.
8. **>100% / cap-at-100 misconception never reachable.** Moderate. Increase `p` capped at 30 (`:241`).
9. **Heavy repetition / thin variety.** Moderate. Same "N apples, p% eaten" frame; variant collisions.
10. **P004_001 mislabeled non-word but always word.** Minor. `:194-200`.
11. **P007 "Before and After" doesn't match its skill description** (never asks to find the original). Minor.

Note: families declare `heuristic:'bar-model'` and the misconception map references hundred-grid/bar scaffolds, but **the generator emits zero diagrams** — even the "100-grid" item is pure text.

**Recommended fixes:** (1) `money()` helper → `$X.YY` everywhere. (2) Constrain GST/discount prices to whole cents; favour 9%. (3) Integer unitary route for find-the-whole. (4) Backfill distractors on collision. (5) Misconception-grounded distractors. (6) Convert high-value application skills to MCQ. (7) Move/justify simple interest. (8) Add `p>100%` variants. (9) Diversify contexts; dedup variants. (10) Differentiate P004 families. (11) Make P007 a work-backwards problem; render the bar models.

### Ratio & Rate
**Classification:** Needs major review

**Strengths:**
- Strong syllabus coverage (15 skills, genuine P5–P6 progression, proportion-algebra correctly excluded); acyclic skill graph, clean misconception map.
- Where it works, arithmetic is sound and number-controlled (divide-in-ratio totals always divisible; percentage cases force `(a+b)|100`; average speed uses total dist ÷ total time).
- R001 MCQ distractors encode real misconceptions; answer-checker normalises ratio/fraction forms.

**Findings:**
1. **Runtime crash ~27% of the time.** Critical. `ratioRateQuestionGenerator.js:360`: `pick(... .filter(([x]) => x > a))` returns `undefined` when `a` is the largest term → destructuring throws. Measured 54/200 variants of `QF_R009_002` crash.
2. **R013_001 "Speed = Distance ÷ Time" never asks for speed.** High. `:501`: branch keys on `name.includes('distance')`, and the family name literally contains "Distance" → always routes to distance/time.
3. **R011_002 "Rate Word Problem" duplicates R011_001 unit-rate.** High. `:438`.
4. **Wrong unit noun on rate questions.** Medium. `:443`: "5 kg of sugar… cost per item" (last word is `sugar`, not `kg`).
5. **"(Word)" families aren't word problems — they duplicate their symbolic sibling.** Medium. R002_002/R004_002/R005_002/R006_002.
6. **R009 "Harder" is identical difficulty (when not crashing).** Medium. `:358`.
7. **Awkward decimal money displays.** Low–Medium. "$12.5", "$2.5", "$4.6" (`:434,:443`).
8. **No diagrams anywhere** despite "visual-first: bar models, ratio tables" promise. Medium.
9. **Distractors only exist for R001.** Low–Medium — misconception map otherwise unexercised.
10. **Level-tag inconsistency** (3-term R004 → P6 but divide-in-ratio R007 → P5; both are P6). Low.

**Recommended fixes:** (1) Guard the empty-filter case before `pick`. (2) Replace `family.name` substring branching with explicit config flags (fixes #2,#3,#5,#6). (3) Derive the unit noun from structured item data. (4) Make "(Word)" families genuinely contextual; give R009_002 a real changed-ratio task. (5) Two-decimal currency / whole-dollar constraint. (6) Bar-model/ratio-table diagram payloads. (7) MCQ variants with misconception distractors for high-value families. (8) Reconcile level tags.

### Whole Numbers / Number Sense
**Classification:** Not exam-ready

**Strengths:**
- Skill graph genuinely well-modelled (23 skills, correct level tagging, validated prerequisites, accurate misconception inventories).
- Question-family metadata rich (per-family fluency targets, mastery thresholds, `workingRequired`, misconception tags).
- Practice/path orchestration coherent.

**Findings:**
1. **Every generator ignores its skill and emits single/double-digit addition.** Critical. `NumberSenseQuestionGenerator.js:72-163`: all 46 `computeAnswer_*` return `a+b`. P4 place-value → "Compute: 3 + 8"; P3 rounding → "Compute: 15 + 6". No place-value, rounding, factor/multiple, comparison, ordering, pattern, estimation, or negative-number question is ever produced.
2. **Number range wildly out of level.** Critical. `:168`: operands from `[2..25]`/`[2..10]`; max answer across 2,880 generated = 33. "Place value to 1,000,000" never shows a number ≥ 100.
3. **Worked solutions vacuous and often false.** High. `:173`: fixed 3-line placeholder; "Calculate" shown for a rounding skill.
4. **Distractors don't encode declared misconceptions.** High. `:190`: `answer±small`.
5. **Negative-number skills (NS021-023) mis-levelled as Primary AND emit positive addition.** High. `NumberSenseSkillGraph.js:346-395`. (Negative numbers enter at Secondary 1.)
6. **Catastrophic repetitiveness.** High. 3,600 generated questions → only 17 distinct stems.
7. **Dead `if(false)/if(true)` scaffolding; `variant % 20` unused.** Medium.
8. **No diagrams** (number lines, place-value charts). Medium.
9. **`acceptedAnswers` can't support inequality/ordering responses.** Medium. `checkNumberSenseAnswer` is exact-match only.

**Recommended fixes:** (1) Implement real per-skill content; drive ranges from `singaporeLevel`. (2) Per-skill range tables. (3) Method-tied worked solutions. (4) Misconception-driven distractors. (5) Reclassify/remove negative numbers. (6) Rounding-tie guards. (7) Expand seed space; remove dead branches. (8) Diagram payloads. (9) Extend checker for `<`/`>`/`=` and ordered lists. *(Skill graph & families are sound and worth keeping.)*

### Four Operations
**Classification:** Not exam-ready

**Strengths:**
- Skill graph curriculum-faithful (24 skills, sensible prerequisites, correct levels, cycle/reachability validator).
- Per-family metadata rich; seeded RNG deterministic; MCQ assembly structurally valid.

**Findings:**
1. **Every generator computes `a + b` regardless of operation.** Critical. `OperationsQuestionGenerator.js:72-168`: 480/480 sampled questions were addition; 0 subtraction/×/÷. Times tables, long division, order of operations, HCF/LCM, bar models, word problems all emit "Compute: a + b".
2. **Operands never exceed 25; no digit-progression.** Critical. `:172`. "Long multiplication 2×2 digit", "Long division by 2-digit", "×10/100/1000" all use the same pool.
3. **No division/remainder/long-division/order-of-ops/bracket logic exists at all.** Critical. OP015/016/019/020/021/022/023/024 are single additions.
4. **`variant`/`v` computed but never used → near-duplicates.** High. `:170-175`.
5. **Worked solutions are generic boilerplate.** High. `:177`.
6. **Distractors are pure numeric jitter, not the tagged misconceptions.** High. `:194`.
7. **No diagrams despite `heuristic:'bar-model'` skills.** Medium. `OperationsSkillGraph.js:394,412`.
8. **Mental-vs-written suitability violated by content.** Medium.
9. **MCQ `value` is a string, short-answer `value` is numeric.** Low.

**Recommended fixes:** (1) Implement real per-operation bodies with correct operator symbols. (2) Per-skill operand ranges tied to level/digit spec. (3) Real generators for division-with-remainder, long division/multiplication, order-of-ops, brackets, factors/multiples, HCF/LCM, bar models, word problems. (4) Validity guards (no negatives at P1–P3; exact vs remainder division). (5) Use `variant`; widen pools. (6) Method-specific worked steps. (7) Misconception-tag distractors. (8) Diagram payloads. (9) Normalise `value` typing.

### Money
**Classification:** Not exam-ready

**Strengths:**
- Seeded RNG deterministic; skill graph acyclic and sensibly ordered (recognise → add → total → change → word problems).
- A subset of templates is correct (MN001_001 coins, MN003 total-cost, MN004 change).
- MCQ distractors de-duplicated/shuffled; integer pools avoid float artifacts in the arithmetic itself.

**Findings:**
1. **Money word problems generate negative answers ("money left").** Critical. `MoneyQuestionGenerator.js:90-91`: `a - b*2` with overlapping pools → "had $6, spent $8/day for 2 days, left = -10". 80/160 (50%) of MN005_002 negative.
2. **Malformed/duplicated decimal in MN002 prompts.** Critical. `:79`: "$0.4.40", "$0.5.50", "$0.25.25" — invalid amounts.
3. **Answers are bare integers, not SGD notation.** High. "$4.00 + $4.00" → "8"; `checkMoneyAnswer` rejects "$8.00".
4. **Cents/dollars unit confusion within single questions.** High. `:74-79`.
5. **Worked solutions placeholder boilerplate.** High.
6. **Distractors don't encode named misconceptions.** High. `:118-238`: `answer ± rint`.
7. **`variant` dead → high repetition.** Medium.
8. **Number realism poor for SGD** (no cents, no realistic prices; decimal-money objective never exercised). Medium.
9. **MN001 prompt/answer pairing loose** (unused `b`). Low.
10. **No coin/note diagrams** for the canonical P1-2 recognition skill. Medium.

**Recommended fixes:** (1) Constrain MN005 to ≥ 0; reject negative money. (2) Single `formatSGD(cents)` helper; eliminate the `b/20` fragment. (3) Integer-cents internally, render `$D.CC`. (4) Make `checkMoneyAnswer` money-aware. (5) One convention per question. (6) Template-specific solutions + bar model for MN005. (7) Misconception distractors. (8) Use `variant`; add cents-bearing realistic prices. (9) Coin/note image metadata + denomination validation.

### Time
**Classification:** Not exam-ready

**Strengths:**
- Skill graph curriculum-aligned (P1→P5, time zones correctly excluded), sensible prerequisites/remediation.
- Misconception tags conceptually right; seeded RNG deterministic.

**Findings:**
1. **Duration answer is grossly wrong — elapsed-time arithmetic is fabricated.** Critical. `TimeQuestionGenerator.js:88-89`: "starts 2:00 pm, ends 14:50 pm, how many minutes?" → answer **770** (= `a*60+b*5`, unrelated to end−start). Every TM005_001 item wrong.
2. **No crossing-midnight, AM/PM, or hour-boundary logic anywhere.** Critical. `:72-91`: pure arithmetic on raw `a,b`, no modular reduction.
3. **Impossible clock faces / impossible times.** Critical. `:76-77,123-152`: "the clock shows 20:15" / "25:" on a 12-hour clock; "14:50 pm".
4. **"60/70 minutes" and other invalid minute fields.** High. `:82-83`: "20 hours 70 minutes = ?".
5. **13-o'clock distractors / AM/PM nonsense in 24-hour MCQ.** High. `:198-211`.
6. **Answers are bare concatenated integers, not time values.** High. `830`, `1230`, `2015`; "8:30" fails the exact-string checker.
7. **Worked solutions placeholder boilerplate.** High.
8. **Dead/contradictory `if(false)/if(true)` branching.** Medium.
9. **High repetitiveness.** Medium.
10. **Distractors don't encode base-10 / AM/PM-flip misconceptions; can collide.** Medium.
11. **Exam realism absent.** Medium.

**Recommended fixes:** (1) Rebuild every generator on minutes-since-midnight with proper formatting; delete the concatenation pattern. (2) TM005: generate start + duration, compute end with carry & midnight rollover; add a crossing-midnight variant. (3) Constrain pools (hours ≤ 12 analog, minutes < 60). (4) Emit clock-face spec and assert it matches. (5) Normalised time-string answers + parsing checker. (6) Per-skill worked methods. (7) Misconception distractors; 4 distinct valid options. (8) Use `variant`/`b`; remove dead branches. (9) Validation harness rejecting minutes ≥ 60, hour > 12 on 12-hr, negative duration.

### Measurement
**Classification:** Not exam-ready

**Strengths:**
- Surrounding infrastructure topic-aware and well-built (14 P1–P6 skills with prerequisites/strands; correct per-skill misconception tags; sound practice engine & learning-path model).
- Seeded RNG, MCQ shuffling, answer-checking plumbing functional.

**Findings:**
1. **Generator is a non-functional STUB — every question is integer addition.** Critical. `MeasurementQuestionGenerator.js:72-127`: all 28 generators return `a+b`. ME007 "Unit conversions" → "Compute: 8 + 8"; ME005 "24-hour clock" → "Compute: 2 + 7". No cm/m/km, kg/g, L/ml ever appears.
2. **No units anywhere.** Critical. `:136,151`. Bare integers; correctness is vacuous.
3. **No unit-conversion logic exists** — the core P3–P6 objective is entirely absent. Critical. `:309-368`.
4. **Distractors are arithmetic noise.** High. `:154`.
5. **Worked solutions generic boilerplate.** High. `:137`.
6. **No diagrams** for scale-reading (ME004) / volume / nets (ME011/012). High.
7. **Massive repetitiveness; difficulty hard-coded `3` for every family.** High. `:132`.
8. **Dead `if(false)/if(true)`.** Low. `:138,153`.
9. **Exam realism: zero.** Critical (cross-cutting).

**Recommended fixes:** (1) Rewrite each generator per skill (length/mass/capacity/scale/time/conversion/perimeter/area/volume/nets/money); remove placeholder scaffolding. (2) Units as first-class data; unit-tolerant checker. (3) Real conversion logic with clean level-appropriate values; compound units P4+. (4) Misconception distractors (wrong factor ×10/×100/×1000, wrong direction, base-60). (5) Method-specific solutions with units. (6) Diagram payloads for visual skills. (7) Per-level ranges & difficulty. (8) Validator asserting every item has a unit and isn't `"Compute:"`. *(Skill graph/families/engine reusable as-is.)*

### Area & Perimeter
**Classification:** Not exam-ready

**Strengths:**
- Genuinely computes geometry (not an `a+b` stub): rectangle/square perimeter & area and triangle area (`½·b·h` with `round2`) verified correct.
- Skill graph syllabus-aligned (AP001/003→P3, AP002→P4, AP004→P5, AP005→P6), acyclic.
- Misconception tags pedagogically real.

**Findings:**
1. **L-shape perimeter answer is arithmetically WRONG.** Critical. `AreaPerimeterQuestionGenerator.js:76-77`: prompt lists six sides summing to **54**, key returns **42** (`2a+3b`). Every AP002_001 item wrong and self-contradicting.
2. **No diagrams emitted** for composite/L-shape (AP002, AP005). Critical — these are fundamentally figure-reading skills; items are ambiguous/unsolvable as intended.
3. **Units missing from every answer.** Major. Area should be `cm²`, perimeter `cm`; the `area-units`/`perimeter-area-confuse` misconceptions can't be tested.
4. **AP005_001 "composite" is geometrically incoherent** (two disjoint rectangles added; `cm²` wrongly applied to dimensions). Major. `:88-89`.
5. **AP005_002 "square cut from a corner" is not a square and can be impossible** (e.g. 12×1 cut from a figure 2 wide). Major. `:90-91`.
6. **AP006_001 is broken/circular** — metres vs "$1 per cm", and the prompt hands the student the perimeter in cm = the answer. Critical. `:92-93`.
7. **Worked solutions vacuous boilerplate.** Major.
8. **Distractors are random offsets, not misconception-based; can land <4 options.** Major. `:107,122`.
9. **Dead `if(false)/if(true)`; `variant` unused.** Minor.
10. **Severe repetitiveness.** Major.
11. **AP004 can produce trivial values (2 cm²) and has no P5 framing.** Minor.

**Recommended fixes:** (1) Make L-shape key = actual sum of printed sides (single source of truth). (2) Emit diagrams for AP002/AP005; don't ship composite items without a figure. (3) Append units; validate them. (4) True joined composite with shared edge & correct labels. (5) Genuine `s×s` cut with `s < min(a,b)`. (6) Rewrite AP006 so the student does the m→cm conversion (don't reveal it). (7) Real worked solutions (formula → substitution → unit-bearing result). (8) Misconception distractors; 4 distinct, none equal the key. (9) Remove dead branches; use `variant`. (10) Widen pools; forbid `a==b`; dedup. (11) Min-area guard + P5 contexts.

### Volume
**Classification:** Not exam-ready

**Strengths:**
- Computes real volume (l×b×h; rate = rate×time) with matching keys; not a stub.
- Clean seeded-RNG, MCQ de-dup/shuffle; coherent skill graph & families (unit cubes → cuboid → nets → water/rate).

**Findings:**
1. **Height is hard-coded into prompts — every question in a family has the same height.** High. `VolumeQuestionGenerator.js:72-87`. Only two of three dimensions vary; `variant` unused.
2. **VL003 MCQ is mathematically incoherent.** Critical. `:82-83,169`: "A cube has side 9 cm… if height doubles to **2** cm…" → 162; asks two things, supplies one answer; `b` is independent so "doubles" is false; a true cube's a³ is never asked.
3. **VL003 mislabeled "nets" but tests no nets.** High. `:81,149-178`. No net diagram, no face-matching.
4. **No diagrams at all** (unit-cube stacks, nets, tanks). High.
5. **Unit handling wrong/missing; cm³/ml/L relationship never tested.** High. `:77,85,87`. "480" accepted, "480 cm³" rejected.
6. **Water-rate family confuses volume/capacity and ducks real content** (fill rate fixed at 1). High. `:84-87`.
7. **`mea/volume-add-edges` distractors are fake (answer±random).** Medium. `:114,144,174,204`.
8. **Solution steps boilerplate.** High.
9. **High repetitiveness.** Medium.
10. **Exam realism low; missing the headline P6 "unknown edge from volume" objective.** Medium.

**Recommended fixes:** (1) Generate all three dimensions; interpolate height into prompt + answer; delete unused `variant`. (2) Rewrite VL003 MCQ as a coherent single item. (3) Make VL003 genuinely about nets (or relabel). (4) Figure payloads for cubes/nets/tanks. (5) Standardise units; unit-aware checker; add capacity/conversion family (1 L = 1000 cm³ = 1000 ml). (6) Real water-level/rate problems with varying rates. (7) Misconception-derived distractors (l+b+h, l×b, ×2, conversion slips). (8) Real worked solutions. (9) More templates / curated pools. (10) Add unknown-edge-from-volume with integer guarantees.

### Geometry
**Classification:** Not exam-ready

**Strengths:**
- Solid non-content scaffolding (deterministic RNG, clean envelope builders, MCQ de-dup/shuffle, working checker).
- Rich correct *metadata*: 22 families spanning real P3–P6 geometry, plausible misconception tags, skill graph with prerequisites.

**Findings:**
1. **The entire generator is an arithmetic STUB — computes zero geometry.** Critical. `GeometryQuestionGenerator.js:72-159`: all 44 functions return `a+b` / "Compute: a + b". GE006 angles → "Compute: 3 + 2"; GE008 triangle angles → "Compute: 25 + 10". No angle sums, no shapes, no triangle properties.
2. **No angle-sum validation possible because no angles exist.** Critical. `:314`: tiny-integer "answers".
3. **No diagrams of any kind.** Critical. `:24-70` (no figure field).
4. **Prompts off-syllabus and age-inappropriate as geometry.** Critical.
5. **Worked solutions generic filler.** High. `:319,679`.
6. **Distractors are arithmetic offsets, not misconceptions.** High. `:186`.
7. **Dead `if(false)/if(true)` toggles.** Medium.
8. **Severe repetitiveness/collisions; shared `id` per family.** Medium. `:26`.
9. **Latent dispatch correctness unverifiable (all stubs).** Low. `:822`.

**Recommended fixes:** (1) Treat as unimplemented; replace all 44 stubs. (2) "Construct-then-constrain" angle generators (pick knowns, derive unknown, assert the 180/360/vertically-opposite/triangle-sum invariant before emitting). (3) Add diagram field; figures must match stated values and be geometrically possible. (4) Per-family worked solutions citing the rule. (5) Misconception-driven distractors (360-vs-180, property confusion). (6) Scope to P3–P6 (no circle theorems/Pythagoras leakage). (7) Unique per-item `id`; widen value space; dedup. (8) Runtime harness asserting sum rules and option validity.

### Circles
**Classification:** Not exam-ready

**Strengths:**
- Genuinely computes circle quantities (not a stub); radius↔diameter, radius-based circumference & area correct and clean.
- Skill graph/families/engine coherent, P6-scoped (no sectors/arc-by-angle), sensible prerequisite chain.
- Uses π = 3.14 consistently and states it.

**Findings:**
1. **Diameter-based AREA answers wrong by ×4 (every CI003_1).** Critical. `CirclesQuestionGenerator.js:82`: computes π·(a/2)² when the radius is already `a` → "area, diameter 20 cm" returns 78.5 (true 314). Marked MCQ answer is the wrong option.
2. **No semicircle/quarter-circle PERIMETER — the headline P6 skill is entirely absent.** Critical. `:84-87`: CI004 only ever asks area. The "+ straight edge" requirement is never tested; `cir/perimeter-arc-only` has no question.
3. **No composite-figure questions exist.** Major.
4. **Distractors random offsets, not misconceptions.** Major. `:114,144,174,204`.
5. **Floating-point garbage shown as options** (`20.560000000000002`, `6.140000000000001`). Major. `:99-204`.
6. **Misconception tags mislabeled/copy-pasted.** Minor–Major.
7. **Worked solutions placeholder; never show the formula or which π.** Major. `:97,112,127`.
8. **π hard-coded to 3.14; 22/7 and clean-number design never used.** Major. `:76-87`.
9. **No rounding/units/"correct to" instruction anywhere.** Major.
10. **Diagrams entirely absent.** Major.
11. **`b` and `variant` unused → low variety; "Word" families produce no word problems.** Minor.
12. **Dead `if(false)/if(true)` branches.** Minor.
13. **Quarter-circle distractor can produce nonsensical "1".** Minor. `:99`.

**Recommended fixes:** (1) Fix CI003_1: area-by-diameter = `3.14*a*a`; add regression test (area-by-d == area-by-r). (2) Add semicircle/quarter PERIMETER generators (πr + 2r; ½πr + 2r) with the straight-edge misconception distractor. (3) Add composite-figure family with labeled diagram. (4) Misconception-derived distractors (r-vs-d, forgot-halve, 2πr-vs-πr², forgot-edge). (5) Round all options/answers; append units. (6) Real worked solutions naming π. (7) π selection (22/7 for multiples of 7; "leave in terms of π" variants; "round to 1 d.p." instruction). (8) Units + unit-tolerant checker. (9) Diagram metadata (radius vs diameter labeled). (10) Use `b`/`variant`; real "Word" problems; remove dead code.

### Statistics
**Classification:** Not exam-ready

**Strengths:**
- Scaffolding sound and syllabus-aligned (ST001–008 map to pictographs/tables→bar→line→interpret→mean→pie; no median/mode/range/SD).
- Several templates compute correctly (table totals, pictograph ×key & difference, bar total/difference, 4-number mean, mean→total, percentage when b>a).
- Misconception tags thematically appropriate; seeded RNG reproducible.

**Findings:**
1. **No diagrams emitted — fatal for a Statistics generator.** Critical. `StatisticsQuestionGenerator.js:24-70`: no graph/table/data field; every "graph" is inline prose.
2. **Pie-chart degree answer wrong by ×10.** Critical. `:100`: `round(a*36/10)` → 40% gives **14°** (correct 144°).
3. **Pie-chart percentages exceed 100% (impossible data).** Critical. `:101`: "120%/150%/250% chose red".
4. **"New mean" answer wrong — always returns the added score.** Critical. `:98`: simplifies to `2a`; "mean 6, add 12 → new mean" returns 12 (correct 6.86).
5. **Line-graph "total rise" nonsensical and self-contradictory.** Critical. `:84-85`: answer is sum of two readings, not a rise; "increased 0°C" / "increased -10°C".
6. **Line-graph "fall" yields negatives.** High. `:86`.
7. **ST008_1 generates part > whole.** High. `:103`: "class of 2 students, 10 chose Science → 500%".
8. **Mean uses `Math.floor`, corrupting non-integer means.** High. `:92,94`.
9. **Worked solutions placeholder stubs.** High. `:113`.
10. **Essentially a STUB generator** (dead `if(false)/if(true)`; several computes don't compute the statistic asked). High.
11. **Distractors arithmetic noise, not misconceptions.** Medium. `:130`.
12. **High repetitiveness; thin item pool.** Medium.
13. **Wording/realism defects** ("From the same chart" with different numbers). Medium. `:91`.

**Recommended fixes:** (1) Emit structured diagram payloads; stem references the figure; validate diagram data == answer source. (2) Pie degrees = `a*36`, cap ≤100%, whole-degree sectors. (3) Constrain parts to sum ≤100% / chosen ≤ total. (4) True new-mean `(a*b+2a)/(b+1)` with integer guarantee. (5) Remove/redefine "total rise"; never 0/negative. (6) Enforce `a≥b` for "fall". (7) Replace `Math.floor` with exact division + divisibility guard. (8) Real worked solutions. (9) Misconception distractors. (10) Expand template banks; randomise contexts. (11) Self-check harness rejecting impossible cases.

### Algebra
**Classification:** Not exam-ready

**Strengths:**
- Domain-specific (not a stub): real templates (letters as unknowns, `3n` notation, substitution, forming expressions, like terms); seeded RNG; coherent 10-skill graph.
- A subset is correct and in-scope: AL003 notation, AL004 forming-and-evaluating, AL005 substitution.

**Findings:**
1. **AL001 & AL002 answer = the RHS total, not the unknown.** Critical. `AlgebraQuestionGenerator.js:72-79`: "n + 7 = 22. What is n?" returns **22** (correct 15); "k × 8 = 24" returns **24**. Every AL001/AL002 item wrong; the MCQ "correct" option is also wrong.
2. **AL006 "simplify like terms" returns a bare number, not a term; produces negative coefficients.** Critical + out of scope. `:92-95`: "5n + 7n" → "12"; "5x − 7x → -2".
3. **AL007 (brackets/distributive) is beyond P6 AND broken.** Critical. `:96-99`: "Expand 20(n+7)… coefficient of n" returns **27**; "8(3n+1)… coefficient" returns **32** (correct 24).
4. **AL008–AL010 (solving 1-step/2-step, word→equation) entirely out of P6 scope.** Major. (6 of 20 families are Secondary content.)
5. **AL009 two-step: prompt RHS and answer key use inconsistent formulas.** Critical. `:104-107`: "2n + 10 = 14" returns **6** (true 2).
6. **Negative/impossible word-problem scenarios.** Major. `:108-111`: "−1" answers; "after giving away 8, she has −5 left".
7. **Worked solutions placeholder boilerplate.** Major. `:121`.
8. **Distractors arithmetic noise, not misconception-based.** Major. `:138,168,198` (`3n` never offers `3+n`).
9. **`misconceptionTag` / family-name mislabels.** Minor. `:90-91,248`.
10. **`variant` unused → repetition / exact dupes.** Minor.
11. **Exam realism low; no diagrams/bar models.** Minor.

**Recommended fixes:** (1) Restrict to the four genuinely-P6 skills; remove/gate AL007–AL010 and the equation-solving variants. (2) Fix keys so the answer is the quantity asked (the unknown, not the total); unify AL009's two RHS formulas; audit every prompt↔answer pair. (3) Make "simplify" return a term string (`"12n"`); forbid negative coefficients. (4) Constrain numbers to exact, non-negative, integer results; keep word problems physically possible. (5) Real per-template working. (6) Misconception-driven distractors. (7) Use `variant`; reconcile labels. (8) Optional bar-model scaffolds for in-scope items.

### Word Problems / Heuristics
**Classification:** Needs major review

**Strengths:**
- `Math-Heuristics-App.html` is a serious, well-structured artifact: the six canonical SG heuristics each with an Understand→Decide→Solve→Check walkthrough; five hand-checked worked examples are arithmetically correct; bar-model method correctly centered.
- The Decision Guide routes problem features to heuristics in a defensible order.
- `heuristicBridge.js` mapping is conservative and largely sound; its test suite enforces every mapped heuristic is PSL-seeded.
- `sg-p4-word-problems.js` static cheatsheet items are correct and bar models match.

**Findings:**
1. **H2 "Find a Pattern" diagram contradicts its own data table.** Critical. `Math-Heuristics-App.html:416-431` (`patternFig`) vs `:491-493` (table): the SVG draws stars `1,1,4,4,9,9,16,16` / squares `0,2,2,6,6,12,12,20` but the table states stars `0,1,2,4,6,9,12,16` / squares `1,2,4,6,9,12,16,20`. In the one heuristic whose entire method is "count the figure, build the table," the picture doesn't match the numbers.
2. **H2 pattern mathematically incoherent across figure, table, and stated rule.** Critical. `:480-500`. The Pattern-100 answer (50) rests on numbers a student cannot reproduce from the figure.
3. **`extractVars` drops digit-suffixed variables → silent empty generation.** High. `shared/mathpath/genericQuestionGenerator.js:151`: `{p2}` is split on the `2`, never bound; templates using `p1/p2`, `x1/x2` substitute nothing → `generateQuestion` returns `null`. Demonstrated live: a two-step template produced 0 of 3 questions.
4. **Generic generator yields unrealistic/age-inappropriate numbers.** High. `:22-29,78-79`: "There were 38503 apples. 4 were eaten." (5-digit vs 1-digit operands).
5. **Grammar bug: no singular/plural agreement.** Medium. "1 were eaten", "1 books".
6. **MCQ distractors arithmetically trivial, not misconception-based.** Medium. `:175-191`: ±1/±2 noise; `misconceptionTag` exists but is unused.
7. **H4 marble/coin generator emits degenerate "0 short" / "0 left over".** Medium. `Math-Heuristics-App.html:987-991` (n=4 lacks the non-zero reroll the n=3 case has).
8. **`heuristicBridge` names heuristics with no content path.** Medium. `services/mathpath/heuristicBridge.js:21-65`: `PSL_SEEDED_HEURISTICS` lists `assumption`, `excess-shortage`, `simultaneous`, `pattern-recognition`, `data-interpretation`, but no slug in `SLUG_TO_HEURISTIC` maps to any of them → half the catalogue is unreachable.
9. **Taxonomy diverges between the HTML app (H1–H6) and the bridge/hintGenerator keys.** Low.
10. **`sg-p4-word-problems.js` is a static cheatsheet, not a generator** (both items correct). Low (informational).
11. **`shared/mathpath/working/` is unrelated to word problems** (upload workflow). Low (informational).

**Recommended fixes:** (1) Re-author H2 end-to-end so figure, table, and rule are one consistent sequence; re-derive Pattern-100. (2) Fix `extractVars` to tokenize `/[a-z]\w*/i`; add a `{p2}` regression test. (3) Post-generation sanity gate (operand magnitude ratio; per-level quantity caps). (4) Pluralization handling. (5) Misconception-tag-driven distractors. (6) Non-zero reroll in `gH4` (n=4). (7) Reconcile `SLUG_TO_HEURISTIC` with `PSL_SEEDED_HEURISTICS`. (8) Unify heuristic vocabulary across surfaces. (9) Spot-check remaining HTML practice generators (figure renderers especially) before release.

---

## Appendix — production wiring (why severity is high)

The stub generators are **live**, not dead code:
- `services/mathpath/{numberSense,operations,geometry,measurement,money,time,statistics}PracticeService.js` import the corresponding `*QuestionGenerator.js`.
- `frontend/src/mathpath/primary/p1–p6Orchestrator.js` import Geometry/Measurement/Money/Time generators.
- `shared/mathpath/domainCatalog.js` marks `practice: 'available'` for Whole Numbers, Four Operations, Decimals, Percentage, Ratio, Rate, etc.

So a student practising "Whole Numbers," "Four Operations," "Geometry," or "Measurement" today receives `Compute: a + b` items mislabelled as those topics. **Fractions** is the only domain with full `available` status across diagnostic/practice/worksheet/assignment/paperAnalysis/intervention, and even it has the answer-key bugs above. Recommend gating the four stub domains out of production until their content layers are implemented.



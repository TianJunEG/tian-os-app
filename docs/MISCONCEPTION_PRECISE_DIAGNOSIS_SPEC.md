# Precise Misconception Diagnosis — Spec

## Goal
Upgrade #244 (Talia's wrong-answer feedback) from **"likely misconception for
this skill"** to **"the specific misconception your answer shows."** E.g. a
student who answers `2/6` to `1/3 + 1/3` added numerators *and* denominators —
name *that*, don't guess from the skill.

## Current state (grounded)
- Questions carry only `answer` + `acceptedAnswers` — **no tagged distractors**,
  no wrong-answer → misconception mapping (`fractionQuestionGenerator.js`).
- `checkFractionAnswer()` returns correctness + normalized answers only.
- #244 does a **skill-level** lookup in `FRACTION_MISCONCEPTION_LIBRARY`.

## Two approaches
### A — Computed-mistake matchers (recommended; no bank changes)
For each common fraction misconception, write a function that **computes the
answer a student would get if they made that mistake**, from the question's
operands. On a wrong answer, run the candidate matchers and see which predicted
answer equals the student's answer → that's the misconception.

Examples:
- *add-across* (`a/b + c/d → (a+c)/(b+d)`)
- *denominator-larger-is-bigger* (picks the larger-denominator fraction)
- *numerator-only compare* (compares numerators, ignores denominators)
- *keep-denominator on add* (`a/b + c/b → (a+c)/(2b)`)

Pros: exact, deterministic, **no bank migration**, reuses `checkFractionAnswer`
normalization. Cons: author + QA a matcher per misconception.

### B — Tagged distractors in the question bank
Generate each question with labelled wrong options (`{value, misconceptionId}`).
Enables exact diagnosis *and* MCQ items, but requires augmenting/regenerating
the question bank — larger, content-heavy.

## Recommendation
**Approach A** for fractions. Upgrade #244's `getMisconceptionHintForSkill` to
`getMisconceptionFromAnswer(question, studentAnswer)`:
1. Run computed-mistake matchers → if one matches, return that misconception's
   kid-friendly hint (precise).
2. Else fall back to the existing skill-level hint.
3. Else render nothing.

So #244 is the foundation; this is a precision layer on top of it, fully
backward-compatible.

## Effort
**Medium.** ~6–10 mistake-matcher functions for the common fraction errors, plus
unit tests asserting each matcher fires on its target wrong answer and not
others. Content/QA pass to confirm the matchers reflect real student errors.

## Decisions needed
- How many matchers to author for v1 (start with the 4–5 most common)?
- Confidence handling when two matchers both match (prefer the most specific).
- Extends per-domain as other misconception libraries land.
